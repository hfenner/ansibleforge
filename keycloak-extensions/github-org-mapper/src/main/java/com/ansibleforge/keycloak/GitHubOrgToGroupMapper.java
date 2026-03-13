package com.ansibleforge.keycloak;

import org.keycloak.broker.oidc.AbstractOAuth2IdentityProvider;
import org.keycloak.broker.provider.AbstractIdentityProviderMapper;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.models.IdentityProviderSyncMode;
import org.keycloak.models.GroupModel;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

import java.net.HttpURLConnection;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class GitHubOrgToGroupMapper extends AbstractIdentityProviderMapper {

    public static final String PROVIDER_ID = "github-org-to-group-mapper";
    private static final String CONFIG_ORG = "github.org";
    private static final String CONFIG_TEAM = "github.team";
    private static final String CONFIG_GROUP = "keycloak.group";
    private static final String GITHUB_API_BASE = "https://api.github.com";

    private static final List<ProviderConfigProperty> CONFIG_PROPERTIES = new ArrayList<>();

    static {
        ProviderConfigProperty orgProperty = new ProviderConfigProperty();
        orgProperty.setName(CONFIG_ORG);
        orgProperty.setLabel("GitHub Organization");
        orgProperty.setHelpText("GitHub organization name. Required.");
        orgProperty.setType(ProviderConfigProperty.STRING_TYPE);
        CONFIG_PROPERTIES.add(orgProperty);

        ProviderConfigProperty teamProperty = new ProviderConfigProperty();
        teamProperty.setName(CONFIG_TEAM);
        teamProperty.setLabel("GitHub Team (optional)");
        teamProperty.setHelpText("GitHub team slug within the organization. If set, only members of this team are mapped. If empty, all org members are mapped.");
        teamProperty.setType(ProviderConfigProperty.STRING_TYPE);
        CONFIG_PROPERTIES.add(teamProperty);

        ProviderConfigProperty groupProperty = new ProviderConfigProperty();
        groupProperty.setName(CONFIG_GROUP);
        groupProperty.setLabel("Keycloak Group");
        groupProperty.setHelpText("Name or path of the Keycloak group to assign. Use '/' for nested groups (e.g., '/admins').");
        groupProperty.setType(ProviderConfigProperty.STRING_TYPE);
        CONFIG_PROPERTIES.add(groupProperty);
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String[] getCompatibleProviders() {
        return new String[]{GitHubIdentityProviderFactory.PROVIDER_ID};
    }

    @Override
    public String getDisplayCategory() {
        return "Group Importer";
    }

    @Override
    public String getDisplayType() {
        return "GitHub Organization/Team to Group";
    }

    @Override
    public String getHelpText() {
        return "Maps GitHub organization or team membership to a Keycloak group. Requires 'read:org' scope on the GitHub identity provider.";
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        return CONFIG_PROPERTIES;
    }

    @Override
    public boolean supportsSyncMode(IdentityProviderSyncMode syncMode) {
        return true;
    }

    @Override
    public void importNewUser(KeycloakSession session, RealmModel realm,
                              UserModel user, IdentityProviderMapperModel mapperModel,
                              BrokeredIdentityContext context) {
        evaluateAndApply(realm, user, mapperModel, context);
    }

    @Override
    public void updateBrokeredUser(KeycloakSession session, RealmModel realm,
                                   UserModel user, IdentityProviderMapperModel mapperModel,
                                   BrokeredIdentityContext context) {
        evaluateAndApply(realm, user, mapperModel, context);
    }

    private void evaluateAndApply(RealmModel realm, UserModel user,
                                  IdentityProviderMapperModel mapperModel,
                                  BrokeredIdentityContext context) {
        String orgName = mapperModel.getConfig().get(CONFIG_ORG);
        String teamSlug = mapperModel.getConfig().get(CONFIG_TEAM);
        String groupPath = mapperModel.getConfig().get(CONFIG_GROUP);

        if (orgName == null || orgName.isBlank() || groupPath == null || groupPath.isBlank()) {
            return;
        }

        GroupModel group = findGroup(realm, groupPath);
        if (group == null) {
            return;
        }

        String accessToken = (String) context.getContextData()
                .get(AbstractOAuth2IdentityProvider.FEDERATED_ACCESS_TOKEN);
        if (accessToken == null) {
            return;
        }

        String username = context.getUsername();
        // The username may be prefixed with alias (e.g., "github.login"), extract the login
        if (username != null && username.contains(".")) {
            username = username.substring(username.indexOf('.') + 1);
        }

        if (username == null || username.isBlank()) {
            return;
        }

        boolean isMember;
        if (teamSlug != null && !teamSlug.isBlank()) {
            isMember = checkTeamMembership(accessToken, orgName, teamSlug, username);
        } else {
            isMember = checkOrgMembership(accessToken, orgName, username);
        }

        if (isMember) {
            user.joinGroup(group);
            context.addMapperAssignedGroup(group.getId());
        } else {
            if (context.hasMapperAssignedGroup(group.getId())) {
                user.leaveGroup(group);
            }
        }
    }

    private boolean checkOrgMembership(String accessToken, String orgName, String username) {
        // GET /orgs/{org}/members/{username} → 204 = member, 404 = not a member
        return checkGitHubApi(accessToken,
                GITHUB_API_BASE + "/orgs/" + orgName + "/members/" + username);
    }

    private boolean checkTeamMembership(String accessToken, String orgName, String teamSlug, String username) {
        // GET /orgs/{org}/teams/{team_slug}/memberships/{username} → 200 = member, 404 = not a member
        try {
            URI uri = URI.create(GITHUB_API_BASE + "/orgs/" + orgName + "/teams/" + teamSlug + "/memberships/" + username);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            conn.disconnect();

            // 200 with state=active means active member
            return responseCode == 200;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkGitHubApi(String accessToken, String url) {
        try {
            URI uri = URI.create(url);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            conn.disconnect();

            return responseCode == 204;
        } catch (Exception e) {
            return false;
        }
    }

    private GroupModel findGroup(RealmModel realm, String groupPath) {
        if (groupPath.startsWith("/")) {
            groupPath = groupPath.substring(1);
        }

        String[] parts = groupPath.split("/");
        Stream<GroupModel> groups = realm.getTopLevelGroupsStream();
        GroupModel current = groups
                .filter(g -> g.getName().equals(parts[0]))
                .findFirst()
                .orElse(null);

        for (int i = 1; i < parts.length && current != null; i++) {
            final String part = parts[i];
            current = current.getSubGroupsStream()
                    .filter(g -> g.getName().equals(part))
                    .findFirst()
                    .orElse(null);
        }

        return current;
    }
}

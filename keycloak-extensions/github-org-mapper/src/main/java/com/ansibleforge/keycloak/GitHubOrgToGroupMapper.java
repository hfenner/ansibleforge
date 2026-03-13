package com.ansibleforge.keycloak;

import org.keycloak.broker.oidc.AbstractOAuth2IdentityProvider;
import org.keycloak.broker.provider.AbstractIdentityProviderMapper;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.broker.provider.IdentityProviderSyncMode;
import org.keycloak.models.GroupModel;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

public class GitHubOrgToGroupMapper extends AbstractIdentityProviderMapper {

    public static final String PROVIDER_ID = "github-org-to-group-mapper";
    private static final String CONFIG_ORG = "github.org";
    private static final String CONFIG_GROUP = "keycloak.group";
    private static final String GITHUB_API_BASE = "https://api.github.com";

    private static final List<ProviderConfigProperty> CONFIG_PROPERTIES = new ArrayList<>();

    static {
        ProviderConfigProperty orgProperty = new ProviderConfigProperty();
        orgProperty.setName(CONFIG_ORG);
        orgProperty.setLabel("GitHub Organization");
        orgProperty.setHelpText("GitHub organization name. Users who are members of this org will be added to the specified Keycloak group.");
        orgProperty.setType(ProviderConfigProperty.STRING_TYPE);
        CONFIG_PROPERTIES.add(orgProperty);

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
        return "GitHub Organization to Group";
    }

    @Override
    public String getHelpText() {
        return "Maps GitHub organization membership to a Keycloak group. Requires 'read:org' scope on the GitHub identity provider.";
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

        boolean isMember = checkOrgMembership(accessToken, orgName, username);

        if (isMember) {
            user.joinGroup(group);
        } else {
            // Only remove if this mapper previously assigned the group
            Set<GroupModel> assignedGroups = context.getMapperAssignedGroups();
            if (assignedGroups != null && assignedGroups.contains(group)) {
                user.leaveGroup(group);
            }
        }

        if (isMember) {
            context.getMapperAssignedGroups().add(group);
        }
    }

    private boolean checkOrgMembership(String accessToken, String orgName, String username) {
        try {
            URI uri = URI.create(GITHUB_API_BASE + "/orgs/" + orgName + "/members/" + username);
            HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);
            conn.setRequestProperty("Accept", "application/vnd.github+json");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            conn.disconnect();

            // 204 = member, 404 = not a member, 302 = requester is not org member
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

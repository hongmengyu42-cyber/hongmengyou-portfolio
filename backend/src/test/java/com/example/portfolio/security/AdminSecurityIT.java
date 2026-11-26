package com.example.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.example.portfolio.admin.AdminUser;
import com.example.portfolio.admin.AdminUserRepository;
import com.example.portfolio.contact.ContactMessageRepository;
import com.example.portfolio.support.PostgresTestBase;

/** End-to-end security behaviour against the real filter chain and a real database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminSecurityIT extends PostgresTestBase {

    private static final String LOGIN = "/api/v1/admin/auth/login";

    @Autowired MockMvc mockMvc;
    @Autowired AdminUserRepository adminUsers;
    @Autowired ContactMessageRepository contactMessages;
    @Autowired PasswordEncoder encoder;

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post(LOGIN).with(csrf()).param("email", email).param("password", password))
                .andReturn();
    }

    @Test
    void publicContentIsReadableWithoutLogin() throws Exception {
        mockMvc.perform(get("/api/v1/projects")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
        mockMvc.perform(get("/api/v1/profile")).andExpect(status().isOk());
        mockMvc.perform(get("/sitemap.xml")).andExpect(status().isOk());
    }

    @Test
    void adminAndUnknownRoutesAreClosedToAnonymousUsers() throws Exception {
        mockMvc.perform(get("/api/v1/admin/projects")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/does-not-exist")).andExpect(status().isUnauthorized()); // deny by default
    }

    @Test
    void loginSucceedsAndTheSessionUnlocksTheAdminApi() throws Exception {
        MvcResult result = login("admin@example.com", "correct-horse-battery-staple");
        assertThat(result.getResponse().getStatus()).isEqualTo(204);

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        mockMvc.perform(get("/api/v1/admin/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@example.com"));
        mockMvc.perform(get("/api/v1/admin/projects").session(session)).andExpect(status().isOk());
    }

    @Test
    void wrongPasswordAndUnknownUserGiveTheSameGenericAnswer() throws Exception {
        MvcResult wrongPassword = login("admin@example.com", "not-the-password");
        MvcResult unknownUser = login("nobody@example.com", "whatever-password");

        assertThat(wrongPassword.getResponse().getStatus()).isEqualTo(401);
        assertThat(unknownUser.getResponse().getStatus()).isEqualTo(401);
        assertThat(wrongPassword.getResponse().getContentAsString())
                .isEqualTo(unknownUser.getResponse().getContentAsString());
    }

    @Test
    void accountLocksAfterRepeatedFailuresEvenWithTheCorrectPassword() throws Exception {
        adminUsers.save(new AdminUser("lockme@example.com", encoder.encode("long-enough-password-1"), "ADMIN"));

        for (int attempt = 0; attempt < 3; attempt++) {   // app.security.max-failed-logins=3 in the test profile
            assertThat(login("lockme@example.com", "wrong-" + attempt).getResponse().getStatus()).isEqualTo(401);
        }
        assertThat(login("lockme@example.com", "long-enough-password-1").getResponse().getStatus())
                .as("locked accounts reject even the right password").isEqualTo(401);
    }

    @Test
    void stateChangingRequestsNeedACsrfToken() throws Exception {
        String body = "{}";
        mockMvc.perform(post("/api/v1/admin/projects").with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/admin/projects").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())                  // passes security, fails validation
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void contactFormStoresRealMessagesAndSilentlyDropsBotSubmissions() throws Exception {
        long before = contactMessages.count();
        String real = """
                {"name":"Ada","email":"ada@example.com","subject":"Hello","message":"A real message here."}""";
        String bot = """
                {"name":"Bot","email":"bot@example.com","subject":"Buy","message":"Cheap pills, click now.",
                 "website":"http://spam.example"}""";

        mockMvc.perform(post("/api/v1/contact").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(real))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/v1/contact").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(bot))
                .andExpect(status().isCreated());

        assertThat(contactMessages.count()).isEqualTo(before + 1);
    }
}

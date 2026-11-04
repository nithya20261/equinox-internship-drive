import { describe, expect, it } from "vitest";
import { Route as LoginRoute } from "../routes/login";
import {
  loginAdminCore,
  loginStudentCore,
  adminGetConfirmedStudentsCore,
  adminGetApplicationsCore,
  getAuthoritativeProfileRoleCore,
} from "../lib/server-auth";

const validateSearch = LoginRoute.options.validateSearch as (search: Record<string, unknown>) => any;

describe("Admin Navigation & Strict Role Segregation Suite", () => {
  describe("1. Login Route Search Parameter Validation (?admin=1)", () => {
    it("recognizes ?admin=1 as admin mode", () => {
      const res = validateSearch({ admin: "1" });
      expect(res).toEqual({ admin: true });
    });

    it("recognizes ?admin=true as admin mode", () => {
      const res = validateSearch({ admin: "true" });
      expect(res).toEqual({ admin: true });
      const resBool = validateSearch({ admin: true });
      expect(resBool).toEqual({ admin: true });
    });

    it("defaults to student mode when admin parameter is absent", () => {
      const res = validateSearch({});
      expect(res).toEqual({});
    });

    it("does not activate admin mode for invalid values like ?admin=0 or ?admin=false", () => {
      const res0 = validateSearch({ admin: "0" });
      expect(res0).toEqual({ admin: false });
      const resFalse = validateSearch({ admin: "false" });
      expect(resFalse).toEqual({ admin: false });
    });
  });

  describe("2. Admin Authentication & Role Verification", () => {
    it("successfully authenticates admin with EQUINOXCIE and returns admin session", async () => {
      const res = await loginAdminCore({
        username: "EQUINOXCIE",
        password: "EQUINOXCIE",
      });

      expect(res.user).toBeDefined();
      expect(res.session).toBeDefined();
      expect(res.token).toBeDefined();

      const roleCheck = await getAuthoritativeProfileRoleCore({ userId: res.user.id });
      expect(roleCheck.role).toBe("admin");
      expect(roleCheck.role).not.toBe("student");
    });

    it("rejects invalid admin usernames or credentials", async () => {
      await expect(
        loginAdminCore({
          username: "INVALIDADMIN",
          password: "EQUINOXCIE",
        })
      ).rejects.toThrow("Invalid administrator username or credentials.");
    });
  });

  describe("3. Student Authentication Independence", () => {
    it("authenticates registered student with CNF independently of admin system", async () => {
      const studentRes = await loginStudentCore({
        cnfNumber: "CNF-8A5CE7",
        password: "CNF-8A5CE7",
      });

      expect(studentRes.user).toBeDefined();
      expect(studentRes.session).toBeDefined();

      const roleCheck = await getAuthoritativeProfileRoleCore({ userId: studentRes.user.id });
      expect(roleCheck.role).toBe("student");
      expect(roleCheck.role).not.toBe("admin");
    });
  });

  describe("4. Route Guard & Data Protection: Student Rejection from Admin Data", () => {
    it("prevents student tokens from accessing admin student records", async () => {
      const studentLogin = await loginStudentCore({
        cnfNumber: "CNF-8A5CE7",
        password: "CNF-8A5CE7",
      });

      await expect(
        adminGetConfirmedStudentsCore({ adminToken: studentLogin.session.access_token })
      ).rejects.toThrow(/Unauthorized/i);
    });

    it("prevents student tokens from accessing admin application records", async () => {
      const studentLogin = await loginStudentCore({
        cnfNumber: "CNF-8A5CE7",
        password: "CNF-8A5CE7",
      });

      await expect(
        adminGetApplicationsCore({ adminToken: studentLogin.session.access_token })
      ).rejects.toThrow(/Unauthorized/i);
    });

    it("allows authorized admin token to access admin records", async () => {
      const adminLogin = await loginAdminCore({
        username: "EQUINOXCIE",
        password: "EQUINOXCIE",
      });

      const students = await adminGetConfirmedStudentsCore({ adminToken: adminLogin.session.access_token });
      expect(students).toBeDefined();
      expect(Array.isArray(students.dbStudents)).toBe(true);
    });
  });
});

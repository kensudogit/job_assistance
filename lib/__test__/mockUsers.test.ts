/**
 * mockUsers のテスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { getMockUsers, getUser, saveUser, userExists, emailExists, type MockUser } from '../mockUsers';

describe('mockUsers', () => {
  beforeEach(() => {
    // 各テスト前にモックユーザーストレージをクリア
    (global as any).mockUsers = undefined;
  });

  describe('getMockUsers', () => {
    it('モックユーザーストレージを初期化する', () => {
      const users = getMockUsers();
      expect(users).toBeInstanceOf(Map);
    });

    it('デフォルトのadminユーザーが作成される', () => {
      const users = getMockUsers();
      const admin = users.get('admin');
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
      expect(admin?.role).toBe('administrator');
    });
  });

  describe('getUser', () => {
    it('存在するユーザーを取得できる', () => {
      const users = getMockUsers();
      const admin = getUser('admin');
      expect(admin).toBeDefined();
      expect(admin?.username).toBe('admin');
    });

    it('存在しないユーザーはundefinedを返す', () => {
      const user = getUser('nonexistent');
      expect(user).toBeUndefined();
    });
  });

  describe('saveUser', () => {
    it('新しいユーザーを保存できる', () => {
      const newUser: MockUser = {
        id: 2,
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainee',
        worker_id: 1,
        mfa_enabled: false,
      };

      saveUser(newUser);
      const savedUser = getUser('testuser');
      expect(savedUser).toEqual(newUser);
    });

    it('既存のユーザーを更新できる', () => {
      const users = getMockUsers();
      const admin = users.get('admin');
      expect(admin).toBeDefined();

      const updatedAdmin: MockUser = {
        ...admin!,
        email: 'newadmin@example.com',
      };

      saveUser(updatedAdmin);
      const savedAdmin = getUser('admin');
      expect(savedAdmin?.email).toBe('newadmin@example.com');
    });
  });

  describe('userExists', () => {
    it('存在するユーザー名でtrueを返す', () => {
      expect(userExists('admin')).toBe(true);
    });

    it('存在しないユーザー名でfalseを返す', () => {
      expect(userExists('nonexistent')).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('存在するメールアドレスでtrueを返す', () => {
      expect(emailExists('admin@example.com')).toBe(true);
    });

    it('存在しないメールアドレスでfalseを返す', () => {
      expect(emailExists('nonexistent@example.com')).toBe(false);
    });

    it('新しいユーザーを追加後、メールアドレスが存在することを確認できる', () => {
      const newUser: MockUser = {
        id: 3,
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'trainee',
        worker_id: null,
        mfa_enabled: false,
      };

      saveUser(newUser);
      expect(emailExists('newuser@example.com')).toBe(true);
    });
  });
});


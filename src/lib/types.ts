export type User = {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  provider: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export type Project = {
  id: string;
  user_id: string;
  template_id: string | null;
  title: string;
  phone: string | null;
  brief: string;
  status: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  thread_user_id?: string;
  sender_role: "customer" | "admin";
  sender_id?: string;
  sender_name?: string | null;
  body: string;
  attachment_key?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  created_at: string;
};

export type ChatGroup = {
  id: string;
  code: string;
  title: string;
  avatarUrl?: string | null;
  last_body?: string | null;
  last_at?: string | null;
  last_sender_id?: string | null;
};

export type ChatThread = {
  id: string;
  name: string;
  email: string;
  last_body: string | null;
  last_at?: string | null;
  last_sender_id?: string | null;
};

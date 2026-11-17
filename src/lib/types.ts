export type User = {
  id: string;
  email: string;
  name: string;
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
  thread_user_id: string;
  sender_role: "customer" | "admin";
  body: string;
  created_at: string;
};

export type ChatThread = {
  id: string;
  name: string;
  email: string;
  last_body: string | null;
};

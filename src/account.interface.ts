export interface Account {
  id: string;
  username: string;
  password: string;
  secret?: string | null;
}

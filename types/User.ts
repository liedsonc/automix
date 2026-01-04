export type User = {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  phone?: string;
  country?: string;
  role?: 'cliente' | 'fornecedor' | 'admin';
};

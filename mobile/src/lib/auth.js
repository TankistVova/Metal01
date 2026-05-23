import { removePushRegistration } from './pushNotifications';
import { supabase } from './supabase';

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) {
    throw new Error(
      error.message.includes('Invalid login credentials')
        ? 'Неверный email или пароль'
        : error.message
    );
  }
}

export async function signUp({ name, email, phone, password }) {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        name,
        phone
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;

    if (userId) {
      await removePushRegistration(userId);
    }
  } catch (error) {
    console.warn('Failed to unregister push token on sign out', error);
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

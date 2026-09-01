import { Access } from 'payload'

/** Будь-який авторизований користувач */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

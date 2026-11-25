import auth from './auth';
import meta from './meta';
import board from './board';
import tickets from './tickets';
import analytics from './analytics';
import admin from './admin';

// To add a feature later (e.g. changes), create modules/changes.ts and add one line here.
export const modules = [auth, meta, board, tickets, analytics, admin];

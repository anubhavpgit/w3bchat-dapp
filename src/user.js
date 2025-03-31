import GUN from 'gun';
import 'gun/sea';
import 'gun/axe';
import { writable } from 'svelte/store';

// Database with reliable peers
// Using multiple peers improves reliability and connection stability
export const db = GUN([
    'https://gun-manhattan.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun'
]);

// Gun User with improved session handling
export const user = db.user().recall({ sessionStorage: true });

// Current User's username with loading and error states
export const username = writable('');
export const isLoading = writable(false);
export const authError = writable(null);

// Better username handling with error catching
user.get('alias').on(v => {
    if (v) username.set(v);
});

// Authentication success handler
db.on('auth', async () => {
    try {
        isLoading.set(true);
        const alias = await user.get('alias');
        if (alias) {
            username.set(alias);
            authError.set(null);
            console.log(`signed in as ${alias}`);
        } else {
            console.warn('Signed in but no alias found');
            authError.set('Authentication successful but username missing');
        }
    } catch (err) {
        console.error('Auth error:', err);
        authError.set(err.message);
    } finally {
        isLoading.set(false);
    }
});

// Helper function to check auth status
export function checkAuthStatus() {
    return new Promise((resolve, reject) => {
        // Give GUN a moment to initialize
        setTimeout(() => {
            if (user.is) {
                resolve(true);
            } else {
                resolve(false);
            }
        }, 100);
    });
}

// Helper function to reset authentication if needed
export function resetAuth() {
    try {
        user.leave();
        username.set('');
        // In case of corrupt session data
        sessionStorage.removeItem('pair');
        sessionStorage.removeItem('recall');
        return true;
    } catch (err) {
        console.error('Reset auth error:', err);
        return false;
    }
}
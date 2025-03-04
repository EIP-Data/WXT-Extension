export default defineContentScript({
    matches: ['*://localhost/*'],
    main() {
        console.log('This script runs ONLY on your website');
    }
});
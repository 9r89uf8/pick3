import { useStore } from '../store/store'; // Ensure you import the correct store

// Fetch posts from the API
export const analyze60 = async () => {
    const setPosts = useStore.getState().setPosts;
    try {
        const response = await fetch('/api/testing/analyze', {
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            const posts = await response.json();
            return posts;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const analyze10K = async () => {
    const setPosts = useStore.getState().setPosts;
    try {
        const response = await fetch('/api/testing/analyzeAllCombinations', {
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            const posts = await response.json();
            return posts;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};
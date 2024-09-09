import { useStore } from '../store/store'; // Ensure you import the correct store

// Fetch posts from the API
export const fetchPosts = async () => {
    const setPosts = useStore.getState().setPosts;
    try {
        const response = await fetch('/api/posts/get');
        console.log(response)

        if (response.ok) {
            const posts = await response.json();
            setPosts(posts);
            return posts;
        } else {
            console.log('error')
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error.message);
        return [];
    }
};


export const deleteAllFromCurrentMonth = async () => {
    try {
        const response = await fetch('/api/posts/deleteAllp');

        if (response.ok) {
            const posts = await response.json();
            return posts;
        } else {
            throw new Error('Failed to delete all posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};


// Create a new post
export const createPost = async () => {
    try {
        const response = await fetch('/api/posts/create', {
            method: 'POST'
        });

        if (response.ok) {
            const newPost = await response.json();
            return newPost;
        } else {
            throw new Error('Failed to create post');
        }
    } catch (error) {
        console.error(error.message);
        return null;
    }
};

export const createAllPosts = async () => {
    try {
        const response = await fetch('/api/posts/createAll', {
            method: 'POST'
        });

        if (response.ok) {
            const newPost = await response.json();
            // addPost(newPost);
            return newPost;
        } else {
            throw new Error('Failed to create post');
        }
    } catch (error) {
        console.error(error.message);
        return null;
    }
};


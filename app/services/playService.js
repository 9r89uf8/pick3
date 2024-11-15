import { useStore } from '../store/store'; // Ensure you import the correct store

export const playNums = async (formData) => {
    const setNumbers = useStore.getState().setNumbers;
    try {
        const response = await fetch('/api/play/playNumbers',{
            method: 'POST',
            cache: 'no-store',
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const numbers = await response.json();
            setNumbers(numbers);
            return numbers;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const checkDraws = async () => {
    const setCheckLoading = useStore.getState().setCheckLoading;
    try {
        setCheckLoading(true)
        const response = await fetch('/api/play/check', {
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            setCheckLoading(false)
            const posts = await response.json();
            return posts;
        } else {
            setCheckLoading(false)
            throw new Error('Failed to check posts');
        }
    } catch (error) {
        setCheckLoading(false)
        console.error(error);
        return [];
    }
};
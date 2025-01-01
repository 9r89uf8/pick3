
import { useStore } from '../store/store'; // Ensure you import the correct store

export const createHistory = async (formData) => {
    const history = useStore.getState().setHistory;
    try {
        const response = await fetch('/api/history/create', {
            method: 'POST',
            cache: 'no-store',
            body: JSON.stringify(formData),
        });
        if (response.ok) {
            const updatedMessage = await response.json();
            history(updatedMessage)
            return updatedMessage;
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        console.error('Error updating:', error);
        return null;
    }
};

export const createDisplay = async () => {
    const display = useStore.getState().setDisplay;
    try {
        const response = await fetch('/api/displayData/permutations', {
            method: 'GET',
            cache: 'no-store'
        });
        if (response.ok) {
            const updatedMessage = await response.json();
            display(updatedMessage)
            return updatedMessage;
        } else {
            throw new Error('Failed to update');
        }
    } catch (error) {
        console.error('Error updating:', error.message);
        return null;
    }
};


export const getHistory = async (formData) => {
    const history = useStore.getState().setHistory;
    try {
        const response = await fetch('/api/history/get',{
            method: 'POST',
            cache: 'no-store',
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            const numbers = await response.json();
            history(numbers);
            return numbers;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getDisplayData = async () => {
    const display = useStore.getState().setDisplay;
    try {
        const response = await fetch('/api/displayData/get',{
            method: 'GET',
            cache: 'no-store'
        });

        if (response.ok) {
            const numbers = await response.json();
            display(numbers);
            return numbers;
        } else {
            throw new Error('Failed to fetch posts');
        }
    } catch (error) {
        console.error(error);
        return [];
    }
};
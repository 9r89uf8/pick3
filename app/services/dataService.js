
import { useStore } from '../store/store'; // Ensure you import the correct store


export const createDataCollection = async () => {
    const display = useStore.getState().setData;
    try {
        const response = await fetch('/api/dataCollection', {
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


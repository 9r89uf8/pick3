import { useStore } from '../store/store'; // Ensure you import the correct store

export const playNums = async () => {
    console.log('play')
    const setNumbers = useStore.getState().setNumbers;
    try {
        const response = await fetch('/api/play/get');

        if (response.ok) {
            const numbers = await response.json();
            console.log(numbers)
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
import axios from "axios";


export const fetchImagesFromBackEnd = (url: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        axios
            .get(`${process.env.REACT_APP_BACKEND_URL}${url}`, { responseType: 'blob' })
            .then((response) => {
                const blob = response.data;
                const src = URL.createObjectURL(blob);
                resolve(src);
            })
            .catch((error) => {
                console.error('Error fetching image from backend:', error);
                resolve(null);
            });
    });
};
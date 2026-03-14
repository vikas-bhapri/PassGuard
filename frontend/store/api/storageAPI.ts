import axios from "axios";
import instance from "@/utils/axios";

export const getSasTokenAPI = async (payload: {content_type: string, content_length: number}) => {
    const response = await instance.post("storage/profile-upload", payload, {
        headers: {
            "Content-Type": "application/json",
        },
    });
    return response.data;
}

export const uploadFileAPI = async (sasUrl: string, file: File) => {
    const response = await axios.put(sasUrl, 
        file,
        {
            headers: {
                "x-ms-blob-type": "BlockBlob",
                "Content-Type": file.type,
            }
        }
    )
    return response.data;
}
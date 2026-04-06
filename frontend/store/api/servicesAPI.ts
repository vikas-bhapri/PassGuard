import instance from "@/utils/axios";

export const fetchServicesAPI = async () => {
    try {
        const response = await instance.get("services/");
        return response.data;
    } catch (error) {
        console.error("Error fetching services:", error);
    }
}

export const createServiceAPI = async (data: { name: string; image_url: string }) => {
    try {
        const response = await instance.post("services/", data, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.data;
    }
    catch (error) {
        console.log("Error creating service:", error);
    }
}


export const deleteServiceAPI = async (serviceId: string) => {
    try {
        await instance.delete(`services/${serviceId}/`);
    }catch (error) {
        console.log("Error deleting service:", error);
    }
}

export const fetchServiceImagesAPI = async () => {
    try {
        const response = await instance.get("services/images");
        return response.data;
    } catch (error) {
        console.log("Error fetching service images:", error);
    }
}
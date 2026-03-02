import instance from "@/utils/axios";

export const loginUserAPI = async (username: string, password: string) => {
    const response = await instance.post("auth/login", {
        username,
        password
    }, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        }
    });
    return response.data;
}

export const signUpUserAPI = async (data: { username: string, password: string, email: string, confirm_password: string }) => {
    const response = await instance.post("auth/", data, {
        headers: {
            "Content-Type": "application/json",
        }
    })
    return response.data;
}

export const getUserProfileAPI = async () => {
    const response = await instance.get("auth/");
    return response.data;
}
import instance from "@/utils/axios";

export const getToDoListAPI = async ({ page, limit, sort, date, is_completed }: { page?: number; limit?: number; sort?: string; date?: string; is_completed?: boolean }) => {
  const validatedParams = validateParams({ page, limit, sort, date, is_completed });
  const queryString = new URLSearchParams(
    Object.entries(validatedParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const response = await instance.get(`todo/${queryString ? `?${queryString}` : ""}`);
  return response.data;
}

const validateParams = (params : { page?: number; limit?: number; sort?: string; date?: string; is_completed?: boolean }) => {
    const { page, limit, sort, date, is_completed } = params;
    const validatedParams = {} as { page?: number; limit?: number; sort?: string; date?: string; is_completed?: boolean };
    if (page !== undefined && (typeof page !== "number" || page < 1)) {
        throw new Error("Invalid page number. It must be a positive integer.");
    }else{
        validatedParams["page"] = page;
    }
    if (limit !== undefined && (typeof limit !== "number" || limit < 1)) {
        throw new Error("Invalid limit. It must be a positive integer.");
    }else{
        validatedParams["limit"] = limit;
    }
    const validSortValues = ["asc", "desc"];
    if (sort !== undefined && !validSortValues.includes(sort)) {
        throw new Error(`Invalid sort value. It must be one of: ${validSortValues.join(", ")}.`);
    }else{
        validatedParams["sort"] = sort;
    }
    if (date !== undefined && isNaN(Date.parse(date))) {
        throw new Error("Invalid date. It must be a valid date string.");
    }else{
        validatedParams["date"] = date;
    }
    if (is_completed !== undefined && typeof is_completed !== "boolean") {
        throw new Error("Invalid is_completed value. It must be a boolean.");
    }else{
        validatedParams["is_completed"] = is_completed;
    }

    return validatedParams;
}


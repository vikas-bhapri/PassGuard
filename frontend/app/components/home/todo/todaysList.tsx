"use client";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { AppDispatch, RootState } from "@/store/store";
import { Todo } from "@/store/slices/todoSlice";

import { fetchToDoList } from "@/store/slices/todoSlice";
import TodoItem from "./TodoItem";

const TodaysList = () => {
  const todaysTodoList = useSelector((state: RootState) => state.todos.todos);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    dispatch(fetchToDoList({ date: today })).unwrap();
  }, [dispatch]);

  return (
    <div>
      {todaysTodoList.length <= 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks for today! Enjoy your day! 🎉
        </p>
      ) : (
        <div>
          {todaysTodoList.map((todo: Todo) => (
            <div className="mb-3" key={todo.id}>
              <TodoItem todo={todo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaysList;

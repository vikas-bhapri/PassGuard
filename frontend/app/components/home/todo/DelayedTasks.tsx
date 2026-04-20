"use client";

import { fetchDelayedToDoList } from "@/store/slices/todoSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import TodoItem from "./TodoItem";

const DelayedTasks = () => {
  const delayedTodoList = useSelector(
    (state: RootState) => state.todos.delayedTodos,
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(fetchDelayedToDoList({ is_completed: false })).unwrap();
  }, [dispatch]);

  return (
    <div>
      <h1 className="text-xl my-4 font-semibold">Delayed Tasks</h1>

      {delayedTodoList.map((task) => (
        <TodoItem key={task.id} todo={task} />
      ))}
    </div>
  );
};

export default DelayedTasks;

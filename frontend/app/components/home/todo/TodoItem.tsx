import { Todo } from "@/store/slices/todoSlice";
import { Divide, PenIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const TodoItem = ({ todo }: { todo: Todo }) => {
  const dangerClass = todo.is_completed
    ? "bg-green-100 text-green-800"
    : new Date() > new Date(todo.complete_by)
      ? "bg-red-100 text-red-800"
      : "border-gray-300";

  return (
    <div className={`border rounded-md p-4 ${dangerClass}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">{todo.title}</h1>
        <div className="flex gap-2">
          <Button variant="secondary">
            <PenIcon />
          </Button>
          <Button variant="destructive">
            <TrashIcon />
          </Button>
        </div>
      </div>
      <p>
        {todo.description.length > 100
          ? `${todo.description.slice(0, 100)}...`
          : todo.description}
      </p>
      <div className="text-sm text-muted-foreground mt-2">
        Complete by: {new Date(todo.complete_by).toLocaleDateString()}
      </div>
    </div>
  );
};

export default TodoItem;

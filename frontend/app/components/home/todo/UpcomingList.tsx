"use client";

import { fetchUpcomingToDoList } from "@/store/slices/todoSlice";
import { AppDispatch, RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import TodoItem from "./TodoItem";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DatePicker } from "../DatePicker";

const ITEMS_PER_PAGE = 5;

const UpcomingList = () => {
  const upcomingTodoList = useSelector(
    (state: RootState) => state.todos.upcomingTodos,
  );
  const loading = useSelector((state: RootState) => state.todos.loading);
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(1);
  const [sortType, setSortType] = useState("asc");
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    dispatch(
      fetchUpcomingToDoList({
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortType,
        ...(filterDate && {
          date: `${filterDate.getFullYear()}-${String(filterDate.getMonth() + 1).padStart(2, "0")}-${String(filterDate.getDate()).padStart(2, "0")}`,
        }),
      }),
    ).unwrap();
  }, [dispatch, page, sortType, filterDate]);

  const handleDateChange = (date: Date | undefined) => {
    setFilterDate(date);
    setPage(1);
  };

  const hasNextPage = upcomingTodoList.length >= ITEMS_PER_PAGE;

  return (
    <>
      <div className="flex items-center justify-between mt-8 mb-4">
        <h1 className="text-xl my-4 font-semibold">Upcoming Tasks</h1>
        <div className="flex items-center gap-3">
          <DatePicker value={filterDate} onChange={handleDateChange} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size={"sm"}>
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-32">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sortType}
                  onValueChange={setSortType}
                >
                  <DropdownMenuRadioItem value="asc">
                    Ascending
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">
                    Descending
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {upcomingTodoList.length <= 0 && !loading ? (
        <p className="text-sm text-muted-foreground">
          No upcoming tasks! Take a break! 🎉
        </p>
      ) : (
        upcomingTodoList.map((todo) => (
          <div className="mb-3" key={todo.id}>
            <TodoItem todo={todo} />
          </div>
        ))
      )}
      {(page > 1 || hasNextPage) && (
        <div className="flex items-center justify-center gap-4 my-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
};

export default UpcomingList;

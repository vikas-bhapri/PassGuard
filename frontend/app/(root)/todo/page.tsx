import DelayedTasks from "@/app/components/home/todo/DelayedTasks";
import TodaysList from "@/app/components/home/todo/todaysList";
import UpcomingList from "@/app/components/home/todo/UpcomingList";

const ToDo = () => {
  return (
    <div className="w-9/10 mx-auto">
      <h1 className="text-xl my-4 font-semibold">Today&apos;s Tasks</h1>
      <TodaysList />
      <DelayedTasks />
      <UpcomingList />
    </div>
  );
};

export default ToDo;

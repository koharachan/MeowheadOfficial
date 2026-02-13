import Link from "next/link";
import {
  MapPinIcon,
  BriefcaseIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function JobItem({ position }: { position: any }) {
  return (
    <Link
      key={position.id}
      href={position.href}
      className="group relative flex items-center space-x-6 rounded-lg border p-6 hover:bg-gray-50"
    >
      <div className="flex-auto">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary">
          {position.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center text-sm text-gray-500">
            <BriefcaseIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            {position.department}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            {position.location}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            {position.level}
          </div>
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {position.type}
          </span>
        </div>
      </div>
      <svg
        className="h-5 w-5 flex-none text-gray-400 group-hover:text-primary"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
}

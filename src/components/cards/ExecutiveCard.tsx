import Image from 'next/image';

interface ExecutiveCardProps {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export const ExecutiveCard = ({ name, role, bio, imageUrl }: ExecutiveCardProps) => {
  return (
    <li className="list-none">
      <Image
        src={imageUrl}
        alt={name}
        width={400}
        height={400}
        className="aspect-[3/3] w-full rounded-2xl object-cover"
      />
      <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">
        {name}
      </h3>
      <p className="text-base leading-7 text-primary">{role}</p>
      <p className="mt-4 text-base leading-7 text-gray-600">
        {bio}
      </p>
    </li>
  );
}; 
import Image from 'next/image';

interface TeamMemberCardProps {
  name: string;
  role: string;
  imageUrl: string;
}

export const TeamMemberCard = ({ name, role, imageUrl }: TeamMemberCardProps) => {
  return (
    <li className="list-none">
      <Image
        src={imageUrl}
        alt={name}
        width={300}
        height={300}
        className="aspect-[1/1] w-full rounded-2xl object-cover"
      />
      <h3 className="mt-6 text-base font-semibold leading-7 text-gray-900">
        {name}
      </h3>
      <p className="text-sm leading-6 text-primary">{role}</p>
    </li>
  );
}; 
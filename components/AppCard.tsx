import Link from 'next/link';
import Image from 'next/image';

interface AppCardProps {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
}

const AppCard: React.FC<AppCardProps> = ({ id, name, description, iconUrl }) => {
  return (
    <Link href={`/app/${id}`} legacyBehavior>
      <a className="group flex flex-col bg-white rounded-xl shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative w-full h-48 bg-gray-200">
          <Image
            src={iconUrl || '/default-icon.png'}
            alt={`${name} icon`}
            layout="fill"
            objectFit="contain"
            className="p-4"
          />
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h2 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
            {name}
          </h2>
          <p className="mt-2 text-gray-600 text-sm flex-grow line-clamp-3">
            {description}
          </p>
        </div>
      </a>
    </Link>
  );
};

export default AppCard;
import { CheckIcon } from '@heroicons/react/24/solid';

export interface PricingTierProps {
  id: string;
  name: string;
  description: string;
  price: string;
  featured?: boolean;
  features: string[];
}

export const PricingTier: React.FC<PricingTierProps> = ({
  name,
  description,
  price,
  featured = false,
  features,
}) => {
  return (
    <div
      className={`flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10 ${
        featured ? 'ring-2 ring-primary shadow-xl scale-105' : 'shadow-sm'
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-x-4">
          <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
          {featured && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold leading-5 text-primary">
              Popular
            </span>
          )}
        </div>
        <p className="mt-4 text-sm leading-6 text-gray-600">{description}</p>
        <p className="mt-6 flex items-baseline gap-x-1">
          <span className="text-4xl font-bold tracking-tight text-gray-900">
            ${price}
          </span>
          <span className="text-sm font-semibold leading-6 text-gray-600">
            /month
          </span>
        </p>
        <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
          {features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <CheckIcon
                className="h-6 w-5 flex-none text-primary"
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          featured
            ? 'bg-primary text-white hover:bg-primary/90 focus-visible:outline-primary'
            : 'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:outline-primary'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}; 
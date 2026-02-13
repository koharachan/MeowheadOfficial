import { testimonials } from '@/config/testimonials';
import TestimonialCard from './cards/TestimonialCard';

const Testimonials = () => {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Customer Testimonials
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Hear what our customers say
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.author.name}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
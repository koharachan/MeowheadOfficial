import Image from 'next/image';
import { StarIcon } from '@heroicons/react/20/solid';
import { Testimonial } from '@/config/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

const TestimonialCard = ({ testimonial }: TestimonialCardProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${
              index < rating ? 'text-yellow-400' : 'text-white/15'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur">
      <div>
        <div className="flex items-center gap-x-4">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src={testimonial.author.imageUrl}
              alt={testimonial.author.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <div className="font-semibold text-white">
              {testimonial.author.name}
            </div>
            <div className="text-sm leading-6 text-white/60">
              {testimonial.author.role} · {testimonial.author.company}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {renderStars(testimonial.rating)}
        </div>
        <div className="mt-8">
          <div className="text-lg font-semibold text-white/80">
            &ldquo;
          </div>
          <div className="mt-1 text-base leading-7 text-white/70">
            {testimonial.content}
          </div>
          <div className="text-lg font-semibold text-white/80 text-right">
            &rdquo;
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
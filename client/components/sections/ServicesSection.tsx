import { ServiceCard } from "@/components/services/ServiceCard";
import { SERVICES } from "@/lib/constants";

export function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive range of services designed to make your life easier and more convenient.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(SERVICES).map(([key, service]) => (
            <ServiceCard
              key={key}
              id={service.id}
              title={service.title}
              description={service.description}
              icon={service.icon}
              color={service.color}
              features={service.features}
              href={`/${service.id}`}
              className="h-full"
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need Multiple Services?
            </h3>
            <p className="text-gray-600 mb-6">
              Bundle your orders and save more. Get groceries delivered while your handyman fixes things at home.
            </p>
            <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Explore Bundles
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const reviews = [
  {
    text: "Вам спасибо большое ещё раз))) эмоций у детей ооочень много да и у взрослых, досих пор 😂😍👍👍👍",
    img: "https://cdn.poehali.dev/projects/286124bd-9c67-48e5-aaae-0d311c22057e/bucket/b2e77ac7-6354-425c-ac14-b76f74186e77.jpg",
    imgAlt: "Отзыв о пенной вечеринке в Новосибирске в WhatsApp — клиент благодарит за пенное шоу",
    imgTitle: "Реальный отзыв о пенной вечеринке в Новосибирске",
  },
  {
    text: "Благодарю😊, теперь у меня есть Ваш контакт, буду обращаться на прямую к Вам за пушкой😁 И рекомендовать)",
    img: "https://cdn.poehali.dev/projects/286124bd-9c67-48e5-aaae-0d311c22057e/bucket/22674bbf-b65c-4f6e-a4d7-2358079de70e.jpg",
    imgAlt: "Отзыв об аренде пенной пушки в Новосибирске — клиент рекомендует пенное шоу",
    imgTitle: "Отзыв об аренде пенной пушки в Новосибирске",
  },
  {
    text: "Спасибо за пенную вечеринку🥳, все в восторге! Телефончик теперь Ваш каждый второй спрашивает😁, раздаю)))",
    img: "https://cdn.poehali.dev/projects/286124bd-9c67-48e5-aaae-0d311c22057e/bucket/c2b740c0-88fa-4b65-bcbd-215aff0aada5.jpg",
    imgAlt: "Отзыв о пенной вечеринке в Новосибирске — все гости в восторге от пенного шоу",
    imgTitle: "Отзыв клиента о пенной вечеринке в Новосибирске",
  },
];

const ReviewsSection = () => {
  return (
    <section id="reviews" className="py-24 px-6 bg-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-accent text-sm font-medium tracking-widest uppercase">Отзывы клиентов</span>
          <h2 className="text-5xl lg:text-6xl font-display font-black mt-3 tracking-tighter">
            Что говорят <span className="text-accent">люди</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-white/5 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="p-6 flex-1">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span key={si} className="text-accent text-lg">★</span>
                  ))}
                </div>
                <p className="text-white/85 text-base leading-relaxed">{r.text}</p>
              </div>
              <div className="border-t border-white/10">
                <img
                  src={r.img}
                  alt={r.imgAlt}
                  title={r.imgTitle}
                  className="w-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://wa.me/79537755111"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-accent/20 hover:bg-accent hover:text-black border border-accent/40 text-accent font-semibold text-lg rounded-full transition-all"
          >
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
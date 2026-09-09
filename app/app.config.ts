export default defineAppConfig({
  awesome: {
    name: 'Sprech Mit Uns',
    description:
      'A focused language learning platform built with Nuxt.js and MongoDB, designed specifically for learners who already have a good command of English and want to advance their German skills. The platform offers tailored lessons, interactive exercises, and progress tracking to help users efficiently improve their German language proficiency while leveraging their existing English knowledge.',
    project: {
      links: {
        github: 'https://github.com/vuduyviet1110',
      },
    },
    layout: {
      page: {
        navbar: {
          menus: [
            { type: 'link', title: 'Học bài', to: '/progress' },
            { type: 'link', title: 'Từ điển', to: '/dictionary' },
            { type: 'link', title: 'Sổ từ vựng', to: '/vocabulary' },
            { type: 'link', title: 'Ôn tập SRS', to: '/review' },
            {
              type: 'dropdown',
              title: 'Luyện tập',
              children: [
                {
                  type: 'link',
                  title: 'Đấu trường Quiz 60s',
                  to: '/sub-menu/quizz',
                },
                {
                  type: 'link',
                  title: 'YouTube Dictation',
                  to: '/sub-menu/youtube',
                },
                {
                  type: 'link',
                  title: 'Tin tức & SRS Reader',
                  to: '/sub-menu/news',
                },
              ],
            },
          ],
        },
      },
      footer: {
        year: new Date().getFullYear(),
      },
      welcome: {
        title: 'Sprech Mit Uns',
        disableInfoReplaceIndexInWelcomePage: true,
      },
    },
    author: {
      name: 'Vitra Vu',
      links: {
        github: 'https://github.com/vuduyviet1110',
        website: 'https://vitravu.vercel.app',
      },
    },
  },
})

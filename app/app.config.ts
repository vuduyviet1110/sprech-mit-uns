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
            { type: 'link', title: 'Lessons', to: { name: 'lesson' } },
            { type: 'link', title: 'Dictionary', to: { name: 'dictionary' } },
            { type: 'link', title: 'Progress', to: { name: 'progress' } },
            { type: 'link', title: 'Vocabulary', to: { name: 'vocabulary' } },
            {
              type: 'dropdown',
              title: 'Documentations',
              children: [
                {
                  type: 'link',
                  title: 'Quizz',
                  to: { name: 'sub-menu-quizz' },
                },
                {
                  type: 'link',
                  title: 'News',
                  to: { name: 'sub-menu-new' },
                },
              ],
            },
            { type: 'button', title: 'Setting', to: { name: 'setting' } },

            // dynamic title
            // {
            //   type: 'button',
            //   title: (nuxt) =>
            //     (nuxt._appConfig as AppConfigInput)?.awesome?.name || '',
            //   to: (nuxt) =>
            //     (nuxt._appConfig as AppConfigInput)?.awesome?.name || '',
            // },
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

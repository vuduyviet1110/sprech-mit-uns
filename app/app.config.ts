export default defineAppConfig({
  awesome: {
    name: 'Sprech Mit Uns',
    description:
      'Nền tảng học tiếng Đức & tiếng Séc chủ động — flashcard 3D, SRS thông minh, nghe chép YouTube và đấu trường Quiz 60s giúp bạn ghi nhớ lâu và phản xạ nhanh.',
    project: {
      links: {
        github: 'https://github.com/vuduyviet1110',
      },
    },
    layout: {
      page: {
        navbar: {
          menus: [
            { type: 'link', title: 'Hôm nay', to: '/today' },
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
                  title: 'Shadowing',
                  to: '/practice/shadowing',
                },
                {
                  type: 'link',
                  title: 'Ôn phát âm',
                  to: '/practice/pronunciation',
                },
                {
                  type: 'link',
                  title: 'Active Recall',
                  to: '/practice/recall',
                },
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

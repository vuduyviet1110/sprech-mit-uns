import { defineEventHandler } from 'h3'

export const scenariosData = [
  {
    id: 'de-restaurant',
    title: 'Im Restaurant (Đặt món & Thanh toán tại nhà hàng)',
    language: 'de',
    level: 'A1-A2',
    description: 'Hóa thân vào thực khách tại nhà hàng ở Berlin: Đặt bàn, chọn món ăn và thanh toán hóa đơn.',
    bgTheme: 'from-amber-950 via-slate-900 to-slate-950',
    nodes: [
      {
        id: 'step-1',
        npcName: 'Kellner (Bồi bàn)',
        npcAvatar: '👨‍🍳',
        npcSpeech: 'Guten Abend! Willkommen im Restaurant Berlin. Haben Sie reserviert?',
        npcSpeechVi: 'Buổi tối vui vẻ! Chào mừng tới nhà hàng Berlin. Quý khách đã đặt bàn trước chưa?',
        choices: [
          {
            text: 'Guten Abend! Nein, ich habe nicht reserviert. Haben Sie einen Tisch frei?',
            translation: 'Chào buổi tối! Chưa, tôi chưa đặt bàn. Nhà hàng còn bàn trống nào không?',
            isBest: true,
            score: 100,
            npcResponse: 'Ja, natürlich! Bitte folgen Sie mir.',
            nextStepId: 'step-2'
          },
          {
            text: 'Hallo! Ich will essen.',
            translation: 'Chào! Tôi muốn ăn.',
            isBest: false,
            score: 50,
            npcResponse: 'Äh, ja... Kommen Sie bitte mit.',
            nextStepId: 'step-2'
          },
          {
            text: 'Nein, danke. Auf Wiedersehen!',
            translation: 'Không, cảm ơn. Tạm biệt!',
            isBest: false,
            score: 0,
            npcResponse: 'Auf Wiedersehen!',
            nextStepId: 'end-early'
          }
        ]
      },
      {
        id: 'step-2',
        npcName: 'Kellner (Bồi bàn)',
        npcAvatar: '👨‍🍳',
        npcSpeech: 'Hier ist die Speisekarte. Was möchten Sie trinken?',
        npcSpeechVi: 'Đây là thực đơn. Quý khách muốn dùng đồ uống gì?',
        choices: [
          {
            text: 'Ich möchte bitte ein Mineralwasser mit Kohlensäure.',
            translation: 'Cho tôi một chai nước khoáng có ga nhé.',
            isBest: true,
            score: 100,
            npcResponse: 'Sehr gerne! Ein Mineralwasser kommt sofort.',
            nextStepId: 'step-3'
          },
          {
            text: 'Bring mir Bier!',
            translation: 'Mang bia ra đây!',
            isBest: false,
            score: 40,
            npcResponse: 'Gut, ein Bier.',
            nextStepId: 'step-3'
          }
        ]
      },
      {
        id: 'step-3',
        npcName: 'Kellner (Bồi bàn)',
        npcAvatar: '👨‍🍳',
        npcSpeech: 'Möchten Sie jetzt bestellen? Was darf es sein?',
        npcSpeechVi: 'Quý khách muốn đặt món ngay chưa? Quý khách chọn món gì ạ?',
        choices: [
          {
            text: 'Ich nehme das Wiener Schnitzel mit Pommes frites, bitte.',
            translation: 'Cho tôi món Schnitzel kiểu Viên kèm khoai tây chiên nhé.',
            isBest: true,
            score: 100,
            npcResponse: 'Ausgezeichnete Wahl! Ich bringe das Essen gleich.',
            nextStepId: 'step-4'
          },
          {
            text: 'Was ist gut hier?',
            translation: 'Ở đây có món gì ngon?',
            isBest: true,
            score: 80,
            npcResponse: 'Das Schnitzel ist unsere Spezialität! Ich bringe Ihnen das Schnitzel.',
            nextStepId: 'step-4'
          }
        ]
      },
      {
        id: 'step-4',
        npcName: 'Kellner (Bồi bàn)',
        npcAvatar: '👨‍🍳',
        npcSpeech: 'Guten Appetit! Hat es Ihnen geschmeckt?',
        npcSpeechVi: 'Chúc ngon miệng! Món ăn có hợp vị quý khách không?',
        choices: [
          {
            text: 'Vielen Dank! Es war sehr lecker. Ich möchte bitte zahlen.',
            translation: 'Cảm ơn rất nhiều! Món ăn rất ngon. Cho tôi xin hóa đơn thanh toán nhé.',
            isBest: true,
            score: 100,
            npcResponse: 'Zusammen oder getrennt?',
            nextStepId: 'step-5'
          }
        ]
      },
      {
        id: 'step-5',
        npcName: 'Kellner (Bồi bàn)',
        npcAvatar: '👨‍🍳',
        npcSpeech: 'Zusammen oder getrennt?',
        npcSpeechVi: 'Thanh toán gộp hay tính riêng ạ?',
        choices: [
          {
            text: 'Ich zahle alles zusammen. Stimmt so! (Khỏi trả lại tiền thừa)',
            translation: 'Tôi trả tất cả. Khỏi cần trả tiền thừa nhé!',
            isBest: true,
            score: 100,
            npcResponse: 'Vielen herzlichen Dank! Einen schönen Abend noch!',
            nextStepId: 'finish'
          }
        ]
      }
    ]
  },
  {
    id: 'cs-restaurant',
    title: 'V restauraci (Hội thoại nhà hàng tại Praha)',
    language: 'cs',
    level: 'A1-A2',
    description: 'Thực hành giao tiếp tiếng Séc thực tế khi đi ăn tại Praha.',
    bgTheme: 'from-blue-950 via-slate-900 to-slate-950',
    nodes: [
      {
        id: 'step-1',
        npcName: 'Číšník (Bồi bàn)',
        npcAvatar: '🤵',
        npcSpeech: 'Dobrý den! Máte rezervaci?',
        npcSpeechVi: 'Xin chào! Quý khách đã đặt bàn chưa?',
        choices: [
          {
            text: 'Dobrý den! Nemám rezervaci. Máte volný stůl?',
            translation: 'Xin chào! Tôi chưa đặt bàn. Còn bàn trống nào không?',
            isBest: true,
            score: 100,
            npcResponse: 'Ano, pojďte prosím sem.',
            nextStepId: 'step-2',
          },
          {
            text: 'Ahoj, chci jíst.',
            translation: 'Chào, tôi muốn ăn.',
            isBest: false,
            score: 40,
            npcResponse: 'Dobře… pojďte prosím.',
            nextStepId: 'step-2',
          },
        ],
      },
      {
        id: 'step-2',
        npcName: 'Číšník (Bồi bàn)',
        npcAvatar: '🤵',
        npcSpeech: 'Co si dáte k pití?',
        npcSpeechVi: 'Quý khách dùng đồ uống gì?',
        choices: [
          {
            text: 'Dám si jedno pivo, prosím.',
            translation: 'Cho tôi một ly bia, cảm ơn.',
            isBest: true,
            score: 100,
            npcResponse: 'Hned to bude!',
            nextStepId: 'step-3',
          },
          {
            text: 'Vodu, prosím.',
            translation: 'Nước lọc, làm ơn.',
            isBest: true,
            score: 90,
            npcResponse: 'Ano, vodu hned přinesu.',
            nextStepId: 'step-3',
          },
        ],
      },
      {
        id: 'step-3',
        npcName: 'Číšník (Bồi bàn)',
        npcAvatar: '🤵',
        npcSpeech: 'A co k jídlu?',
        npcSpeechVi: 'Còn món ăn thì sao ạ?',
        choices: [
          {
            text: 'Dám si svíčkovou s knedlíky, prosím.',
            translation: 'Cho tôi món thịt sốt kem với bánh hấp.',
            isBest: true,
            score: 100,
            npcResponse: 'Výborná volba!',
            nextStepId: 'step-4',
          },
          {
            text: 'Co doporučujete?',
            translation: 'Bạn gợi ý món gì?',
            isBest: true,
            score: 85,
            npcResponse: 'Svíčková je naše specialita.',
            nextStepId: 'step-4',
          },
        ],
      },
      {
        id: 'step-4',
        npcName: 'Číšník (Bồi bàn)',
        npcAvatar: '🤵',
        npcSpeech: 'Dobrou chuť! Chutnalo vám?',
        npcSpeechVi: 'Chúc ngon miệng! Có hợp vị không ạ?',
        choices: [
          {
            text: 'Ano, bylo to výborné. Účet, prosím.',
            translation: 'Vâng, rất ngon. Xin hóa đơn ạ.',
            isBest: true,
            score: 100,
            npcResponse: 'Děkujeme! Na shledanou!',
            nextStepId: 'finish',
          },
        ],
      },
    ],
  },
  {
    id: 'de-bahnhof',
    title: 'Am Bahnhof (Hỏi đường & mua vé tàu)',
    language: 'de',
    level: 'A2',
    description: 'Thực hành hỏi đường, mua vé và tìm sân ga ở Đức.',
    bgTheme: 'from-emerald-950 via-slate-900 to-slate-950',
    nodes: [
      {
        id: 'step-1',
        npcName: 'Mitarbeiterin',
        npcAvatar: '🎫',
        npcSpeech: 'Guten Tag! Kann ich Ihnen helfen?',
        npcSpeechVi: 'Xin chào! Tôi có thể giúp gì ạ?',
        choices: [
          {
            text: 'Ja, ich brauche eine Fahrkarte nach München, bitte.',
            translation: 'Vâng, tôi cần vé đi München ạ.',
            isBest: true,
            score: 100,
            npcResponse: 'Einfach oder hin und zurück?',
            nextStepId: 'step-2',
          },
          {
            text: 'Ticket München!',
            translation: 'Vé München!',
            isBest: false,
            score: 40,
            npcResponse: 'Bitte sprechen Sie etwas langsamer… Einfachfahrt?',
            nextStepId: 'step-2',
          },
        ],
      },
      {
        id: 'step-2',
        npcName: 'Mitarbeiterin',
        npcAvatar: '🎫',
        npcSpeech: 'Einfach oder hin und zurück?',
        npcSpeechVi: 'Một chiều hay khứ hồi ạ?',
        choices: [
          {
            text: 'Hin und zurück, bitte. Wann fährt der nächste Zug?',
            translation: 'Khứ hồi ạ. Chuyến tiếp theo lúc nào?',
            isBest: true,
            score: 100,
            npcResponse: 'Um 14:30 von Gleis 5.',
            nextStepId: 'step-3',
          },
        ],
      },
      {
        id: 'step-3',
        npcName: 'Mitarbeiterin',
        npcAvatar: '🎫',
        npcSpeech: 'Der Zug fährt um 14:30 von Gleis 5. Noch etwas?',
        npcSpeechVi: 'Tàu khởi hành 14:30 từ đường ray 5. Còn gì nữa không ạ?',
        choices: [
          {
            text: 'Nein, danke. Wo ist Gleis 5?',
            translation: 'Không, cảm ơn. Đường ray 5 ở đâu?',
            isBest: true,
            score: 100,
            npcResponse: 'Links den Gang entlang, dann rechts.',
            nextStepId: 'finish',
          },
        ],
      },
    ],
  },
  {
    id: 'cs-doktor',
    title: 'U doktora (Khám bệnh bằng tiếng Séc)',
    language: 'cs',
    level: 'A2',
    description: 'Mô tả triệu chứng và đặt lịch khám bằng tiếng Séc.',
    bgTheme: 'from-rose-950 via-slate-900 to-slate-950',
    nodes: [
      {
        id: 'step-1',
        npcName: 'Recepční',
        npcAvatar: '🏥',
        npcSpeech: 'Dobrý den, objednali jste se?',
        npcSpeechVi: 'Xin chào, quý khách đã đặt lịch chưa?',
        choices: [
          {
            text: 'Dobrý den, ano. Jmenuji se Novák a mám termín v deset.',
            translation: 'Xin chào, vâng. Tôi tên Novák và có lịch lúc 10 giờ.',
            isBest: true,
            score: 100,
            npcResponse: 'Výborně, posaďte se prosím.',
            nextStepId: 'step-2',
          },
        ],
      },
      {
        id: 'step-2',
        npcName: 'Doktor',
        npcAvatar: '👨‍⚕️',
        npcSpeech: 'Co vás bolí?',
        npcSpeechVi: 'Bạn bị đau chỗ nào?',
        choices: [
          {
            text: 'Bolí mě hlava a mám horečku už dva dny.',
            translation: 'Tôi đau đầu và sốt đã hai ngày.',
            isBest: true,
            score: 100,
            npcResponse: 'Rozumím. Podívám se na vás.',
            nextStepId: 'step-3',
          },
          {
            text: 'Jsme nemocní.',
            translation: 'Tôi bị ốm.',
            isBest: false,
            score: 50,
            npcResponse: 'Kde přesně? Hlava? Krk?',
            nextStepId: 'step-3',
          },
        ],
      },
      {
        id: 'step-3',
        npcName: 'Doktor',
        npcAvatar: '👨‍⚕️',
        npcSpeech: 'Berte tyto tablety třikrát denně a odpočívejte.',
        npcSpeechVi: 'Uống thuốc này ngày ba lần và nghỉ ngơi.',
        choices: [
          {
            text: 'Děkuji, pane doktore. Na shledanou!',
            translation: 'Cảm ơn bác sĩ. Tạm biệt!',
            isBest: true,
            score: 100,
            npcResponse: 'Uzdravte se brzy!',
            nextStepId: 'finish',
          },
        ],
      },
    ],
  },
]

export default defineEventHandler(async () => {
  return scenariosData
})

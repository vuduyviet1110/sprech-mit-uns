import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const initialTopics = [
  {
    name: 'Begrüßung & Vorstellung',
    slug: 'begruessung-vorstellung',
    level: 'A1',
    language: 'de',
    description: 'Các mẫu câu chào hỏi, tự giới thiệu bản thân và giao tiếp cơ bản hàng ngày.',
    paragraph: 'Guten Tag! Ich heiße Anna und komme aus Deutschland. Ich wohne in Berlin und lerne Deutsch.',
    englishTranslation: 'Xin chào! Tôi tên là Anna và đến từ Đức. Tôi sống ở Berlin và đang học tiếng Đức.',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
  },
  {
    name: 'Essen & Trinken',
    slug: 'essen-trinken',
    level: 'A1',
    language: 'de',
    description: 'Từ vựng món ăn, thức uống, dụng cụ nhà bếp và cách gọi món tại nhà hàng.',
    paragraph: 'Ich hätte gerne einen Kaffee und ein Stück Kuchen, bitte. Das Essen schmeckt sehr lecker.',
    englishTranslation: 'Tôi muốn gọi một tách cà phê và một miếng bánh ngọt. Món ăn rất ngon.',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
  },
  {
    name: 'Familie & Freunde',
    slug: 'familie-freunde',
    level: 'A1',
    language: 'de',
    description: 'Các thành viên trong gia đình, mối quan hệ bạn bè và mô tả người.',
    paragraph: 'Meine Familie ist nicht sehr groß. Ich habe einen Bruder und eine Schwester.',
    englishTranslation: 'Gia đình tôi không lớn lắm. Tôi có một anh trai và một em gái.',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
  },
  {
    name: 'Zahlen & Zeit',
    slug: 'zahlen-zeit',
    level: 'A1',
    language: 'de',
    description: 'Con số, ngày tháng, giờ giấc, các ngày trong tuần và thời gian.',
    paragraph: 'Es ist jetzt acht Uhr morgens. Wie viel Uhr ist es bei dir?',
    englishTranslation: 'Bây giờ là 8 giờ sáng. Ở chỗ bạn là mấy giờ rồi?',
    difficulty: 'Easy',
    estimatedTime: '15 mins',
  },
  {
    name: 'Einkaufen & Kleidung',
    slug: 'einkaufen-kleidung',
    level: 'A2',
    language: 'de',
    description: 'Mua sắm, trang phục, kích cỡ, giá cả, phương thức thanh toán.',
    paragraph: 'Wie viel kostet diese blaue Jacke? Kann ich mit Kreditkarte bezahlen?',
    englishTranslation: 'Chiếc áo khoác xanh này giá bao nhiêu? Tôi có thể thanh toán bằng thẻ tín dụng không?',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
  },
  {
    name: 'Reisen & Verkehr',
    slug: 'reisen-verkehr',
    level: 'A2',
    language: 'de',
    description: 'Du lịch, phương tiện giao thông, hỏi đường và đặt phòng khách sạn.',
    paragraph: 'Der Zug nach Berlin fährt von Gleis 4 ab. Die Fahrt dauert etwa zwei Stunden.',
    englishTranslation: 'Tàu đi Berlin khởi hành từ ga số 4. Chuyến đi mất khoảng 2 giờ.',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
  },
  {
    name: 'Gesundheit & Körper',
    slug: 'gesundheit-koerper',
    level: 'A2',
    language: 'de',
    description: 'Các bộ phận cơ thể, triệu chứng bệnh, khám bác sĩ và tiệm thuốc.',
    paragraph: 'Ich habe Kopfschmerzen und Fieber. Ich muss einen Termin beim Arzt machen.',
    englishTranslation: 'Tôi bị đau đầu và sốt. Tôi cần đặt lịch hẹn với bác sĩ.',
    difficulty: 'Medium',
    estimatedTime: '20 mins',
  },
  {
    name: 'Arbeit & Beruf',
    slug: 'arbeit-beruf',
    level: 'B1',
    language: 'de',
    description: 'Nghề nghiệp, môi trường công sở, phỏng vấn xin việc và hội thoại công việc.',
    paragraph: 'Ich nehme an einer wichtigen Besprechung mit dem neuen Kunden teil.',
    englishTranslation: 'Tôi đang tham gia một cuộc họp quan trọng với khách hàng mới.',
    difficulty: 'Hard',
    estimatedTime: '30 mins',
  },
  {
    name: 'Wohnen & Haushalt',
    slug: 'wohnen-haushalt',
    level: 'B1',
    language: 'de',
    description: 'Nhà ở, tìm căn hộ, nội thất và công việc nhà hàng ngày.',
    paragraph: 'Unsere neue Wohnung hat drei Zimmer, eine moderne Küche und einen schönen Balkon.',
    englishTranslation: 'Căn hộ mới của chúng tôi có 3 phòng, nhà bếp hiện đại và ban công đẹp.',
    difficulty: 'Hard',
    estimatedTime: '30 mins',
  },
  {
    name: 'Medien & Kommunikation',
    slug: 'medien-kommunikation',
    level: 'B1',
    language: 'de',
    description: 'Truyền thông, mạng xã hội, tin tức và các kênh thông tin điện tử.',
    paragraph: 'Die sozialen Medien verändern die Art und Weise, wie wir miteinander kommunizieren.',
    englishTranslation: 'Mạng xã hội đang thay đổi cách thức chúng ta giao tiếp với nhau.',
    difficulty: 'Hard',
    estimatedTime: '30 mins',
  },
  {
    name: 'Umwelt & Politik',
    slug: 'umwelt-politik',
    level: 'B2',
    language: 'de',
    description: 'Môi trường, biến đổi khí hậu, năng lượng tái tạo, chính trị và xã hội.',
    paragraph: 'Erneuerbare Energien spielen eine entscheidende Rolle im globalen Klimaschutz.',
    englishTranslation: 'Năng lượng tái tạo đóng vai trò quyết định trong việc bảo vệ khí hậu toàn cầu.',
    difficulty: 'Advanced',
    estimatedTime: '40 mins',
  },
  {
    name: 'Wirtschaft & Finanzen',
    slug: 'wirtschaft-finanzen',
    level: 'B2',
    language: 'de',
    description: 'Kinh tế, tài chính ngân hàng, đầu tư và ngân sách quốc gia.',
    paragraph: 'Die Inflation beeinflusst die Kaufkraft der Verbraucher maßgeblich.',
    englishTranslation: 'Lạm phát ảnh hưởng đáng kể đến sức mua của người tiêu dùng.',
    difficulty: 'Advanced',
    estimatedTime: '40 mins',
  },
  {
    name: 'Wissenschaft & Forschung',
    slug: 'wissenschaft-forschung',
    level: 'C1',
    language: 'de',
    description: 'Nghiên cứu khoa học, công nghệ tri thức và thuật ngữ chuyên ngành nâng cao.',
    paragraph: 'Die neueste Studie liefert fundierte Erkenntnisse über die künstliche Intelligenz.',
    englishTranslation: 'Nghiên cứu mới nhất cung cấp những hiểu biết sâu sắc về trí tuệ nhân tạo.',
    difficulty: 'Expert',
    estimatedTime: '45 mins',
  },
  {
    name: 'Kultur & Philosophie',
    slug: 'kultur-philosophie',
    level: 'C2',
    language: 'de',
    description: 'Văn học, triết học Đức, nghệ thuật và suy ngẫm lý luận nâng cao.',
    paragraph: 'Die philosophische Abhandlung hinterfragt die grundlegenden Werte der modernen Gesellschaft.',
    englishTranslation: 'Luận văn triết học đặt câu hỏi về các giá trị cơ bản của xã hội hiện đại.',
    difficulty: 'Expert',
    estimatedTime: '50 mins',
  },
]

const initialVocabulary = [
  // A1
  { word: 'Hallo', meaning: 'Xin chào (Thân mật)', example: 'Hallo, wie geht es dir?', pronunciation: '/haˈloː/', type: 'Interjection', transcription: 'ha-lo', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Guten Tag', meaning: 'Chào buổi trưa / Chào ban ngày (Lịch sự)', example: 'Guten Tag, Herr Müller!', pronunciation: '/ˈɡuːtn̩ taːk/', type: 'Phrase', transcription: 'goo-ten tahk', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Guten Morgen', meaning: 'Chào buổi sáng', example: 'Guten Morgen! Hast du gut geschlafen?', pronunciation: '/ˈɡuːtn̩ ˈmɔʁɡn̩/', type: 'Phrase', transcription: 'goo-ten mor-gen', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Guten Abend', meaning: 'Chào buổi tối', example: 'Guten Abend meine Damen und Herren.', pronunciation: '/ˈɡuːtn̩ ˈaːbn̩t/', type: 'Phrase', transcription: 'goo-ten ah-bent', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Tschüss', meaning: 'Tạm biệt (Thân mật)', example: 'Tschüss, bis morgen!', pronunciation: '/tʃʏs/', type: 'Interjection', transcription: 'tshooss', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Auf Wiedersehen', meaning: 'Hẹn gặp lại / Tạm biệt (Lịch sự)', example: 'Auf Wiedersehen, Frau Schmidt!', pronunciation: '/aʊ̯f ˈviːdɐˌzeːən/', type: 'Phrase', transcription: 'owf vee-der-zay-en', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'heißen', meaning: 'Tên là / Gọi là', example: 'Ich heiße Thomas.', pronunciation: '/ˈhaɪ̯sn̩/', type: 'Verb', transcription: 'hye-sen', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'kommen', meaning: 'Đến (từ đâu)', example: 'Ich komme aus Vietnam.', pronunciation: '/ˈkɔmən/', type: 'Verb', transcription: 'kom-men', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'wohnen', meaning: 'Sống / Cư trú', example: 'Ich wohne in Hanoi.', pronunciation: '/ˈvoːnən/', type: 'Verb', transcription: 'voh-nen', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Danke', meaning: 'Cảm ơn', example: 'Danke schön für deine Hilfe!', pronunciation: '/ˈdaŋkə/', type: 'Interjection', transcription: 'dahn-keh', level: 'A1', topicSlug: 'begruessung-vorstellung' },
  { word: 'Bitte', meaning: 'Xin lỗi / Làm ơn / Không có gì', example: 'Wie bitte? Ich verstehe nicht.', pronunciation: '/ˈbɪtə/', type: 'Interjection', transcription: 'bit-teh', level: 'A1', topicSlug: 'begruessung-vorstellung' },

  { word: 'der Kaffee', meaning: 'Cà phê', example: 'Ich trinke morgens gerne Kaffee.', pronunciation: '/ˈkafe/', type: 'Noun', transcription: 'der kah-fay', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'das Wasser', meaning: 'Nước lọc', example: 'Ein Glas Wasser, bitte.', pronunciation: '/ˈvasɐ/', type: 'Noun', transcription: 'das vah-ser', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'das Brot', meaning: 'Bánh mì', example: 'Frisches Brot schmeckt am besten.', pronunciation: '/bʁoːt/', type: 'Noun', transcription: 'das broht', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'die Milch', meaning: 'Sữa', example: 'Trinkst du Kaffee mit Milch?', pronunciation: '/mɪlç/', type: 'Noun', transcription: 'dee milkh', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'der Tee', meaning: 'Trà', example: 'Grüner Tee ist gesund.', pronunciation: '/teː/', type: 'Noun', transcription: 'der tay', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'der Apfel', meaning: 'Quả táo', example: 'Ich esse jeden Tag einen Apfel.', pronunciation: '/ˈapfl̩/', type: 'Noun', transcription: 'der ahp-fel', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'essen', meaning: 'Ăn', example: 'Was möchtest du heute essen?', pronunciation: '/ˈɛsn̩/', type: 'Verb', transcription: 'es-sen', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'trinken', meaning: 'Uống', example: 'Wir trinken zusammen ein Bier.', pronunciation: '/ˈtʁɪŋkn̩/', type: 'Verb', transcription: 'tring-ken', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'lecker', meaning: 'Ngon miệng', example: 'Das Essen ist wirklich lecker!', pronunciation: '/ˈlɛkɐ/', type: 'Adjective', transcription: 'lek-ker', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'die Speisekarte', meaning: 'Thực đơn', example: 'Könnte ich bitte die Speisekarte haben?', pronunciation: '/ˈʃpaɪ̯zəˌkaʁtə/', type: 'Noun', transcription: 'dee shpye-zeh-kar-teh', level: 'A1', topicSlug: 'essen-trinken' },
  { word: 'die Rechnung', meaning: 'Hóa đơn tiền', example: 'Die Rechnung, bitte!', pronunciation: '/ˈʁɛçnʊŋ/', type: 'Noun', transcription: 'dee rekh-noong', level: 'A1', topicSlug: 'essen-trinken' },

  { word: 'die Mutter', meaning: 'Mẹ', example: 'Meine Mutter kocht sehr gut.', pronunciation: '/ˈmʊtɐ/', type: 'Noun', transcription: 'dee moot-ter', level: 'A1', topicSlug: 'familie-freunde' },
  { word: 'der Vater', meaning: 'Bố / Cha', example: 'Mein Vater arbeitet bei Siemens.', pronunciation: '/ˈfaːtɐ/', type: 'Noun', transcription: 'der fah-ter', level: 'A1', topicSlug: 'familie-freunde' },
  { word: 'der Bruder', meaning: 'Anh / Em trai', example: 'Mein Bruder studiert Medizin.', pronunciation: '/ˈbʁuːdɐ/', type: 'Noun', transcription: 'der broo-der', level: 'A1', topicSlug: 'familie-freunde' },
  { word: 'die Schwester', meaning: 'Chị / Em gái', example: 'Meine Schwester ist Lehrerin.', pronunciation: '/ˈʃvɛstɐ/', type: 'Noun', transcription: 'dee shves-ter', level: 'A1', topicSlug: 'familie-freunde' },
  { word: 'der Freund', meaning: 'Bạn nam / Bạn trai', example: 'Ich treffe heute Abend einen Freund.', pronunciation: '/fʁɔɪ̯nt/', type: 'Noun', transcription: 'der froynt', level: 'A1', topicSlug: 'familie-freunde' },
  { word: 'die Freundin', meaning: 'Bạn nữ / Bạn gái', example: 'Meine Freundin wohnt in München.', pronunciation: '/ˈfʁɔɪ̯ndɪn/', type: 'Noun', transcription: 'dee froyn-din', level: 'A1', topicSlug: 'familie-freunde' },

  { word: 'eins', meaning: 'Số một (1)', example: 'Ich habe nur eins.', pronunciation: '/aɪ̯ns/', type: 'Number', transcription: 'ayns', level: 'A1', topicSlug: 'zahlen-zeit' },
  { word: 'zwei', meaning: 'Số hai (2)', example: 'Zwei Kaffee, bitte!', pronunciation: '/tsvaɪ̯/', type: 'Number', transcription: 'tsvye', level: 'A1', topicSlug: 'zahlen-zeit' },
  { word: 'drei', meaning: 'Số ba (3)', example: 'Es dauert drei Tage.', pronunciation: '/dʁaɪ̯/', type: 'Number', transcription: 'drye', level: 'A1', topicSlug: 'zahlen-zeit' },
  { word: 'die Uhr', meaning: 'Đồng hồ / Giờ', example: 'Es ist genau vier Uhr.', pronunciation: '/uːʁ/', type: 'Noun', transcription: 'dee oor', level: 'A1', topicSlug: 'zahlen-zeit' },
  { word: 'heute', meaning: 'Hôm nay', example: 'Heute habe ich frei.', pronunciation: '/ˈhɔɪ̯tə/', type: 'Adverb', transcription: 'hoy-teh', level: 'A1', topicSlug: 'zahlen-zeit' },
  { word: 'morgen', meaning: 'Ngày mai / Buổi sáng', example: 'Bis morgen Früh!', pronunciation: '/ˈmɔʁɡn̩/', type: 'Adverb', transcription: 'mor-gen', level: 'A1', topicSlug: 'zahlen-zeit' },

  // A2
  { word: 'die Kleidung', meaning: 'Quần áo / Trang phục', example: 'Im Winter brauche ich warme Kleidung.', pronunciation: '/ˈklaɪ̯dʊŋ/', type: 'Noun', transcription: 'dee klye-doong', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'kaufen', meaning: 'Mua', example: 'Wir kaufen Gemüse auf dem Markt.', pronunciation: '/ˈkaʊ̯fn̩/', type: 'Verb', transcription: 'kow-fen', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'bezahlen', meaning: 'Thanh toán / Trả tiền', example: 'Kann ich mit Karte bezahlen?', pronunciation: '/bəˈtsaːlən/', type: 'Verb', transcription: 'beh-tsah-len', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'die Jacke', meaning: 'Áo khoác ngắn', example: 'Diese rote Jacke ist sehr schön.', pronunciation: '/ˈjakə/', type: 'Noun', transcription: 'dee yah-keh', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'die Hose', meaning: 'Quần dài', example: 'Die Hose ist etwas zu lang.', pronunciation: '/ˈhoːzə/', type: 'Noun', transcription: 'dee hoh-zeh', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'billig', meaning: 'Rẻ tiền', example: 'Dieses T-Shirt ist wirklich billig.', pronunciation: '/ˈbɪlɪç/', type: 'Adjective', transcription: 'bil-likh', level: 'A2', topicSlug: 'einkaufen-kleidung' },
  { word: 'teuer', meaning: 'Đắt tiền', example: 'Das Auto ist mir zu teuer.', pronunciation: '/ˈtɔɪ̯ɐ/', type: 'Adjective', transcription: 'toy-er', level: 'A2', topicSlug: 'einkaufen-kleidung' },

  { word: 'der Bahnhof', meaning: 'Nhà ga tàu hỏa', example: 'Wo ist der nächste Bahnhof?', pronunciation: '/ˈbaːnˌhoːf/', type: 'Noun', transcription: 'der bahn-hof', level: 'A2', topicSlug: 'reisen-verkehr' },
  { word: 'reisen', meaning: 'Đi du lịch', example: 'Ich reise sehr gerne nach Deutschland.', pronunciation: '/ˈʁaɪ̯zn̩/', type: 'Verb', transcription: 'rye-zen', level: 'A2', topicSlug: 'reisen-verkehr' },
  { word: 'der Zug', meaning: 'Tàu hỏa', example: 'Pünktlich um 10 Uhr kommt der Zug an.', pronunciation: '/tsuːk/', type: 'Noun', transcription: 'der tsoog', level: 'A2', topicSlug: 'reisen-verkehr' },
  { word: 'das Ticket', meaning: 'Vé (xe/tàu/máy bay)', example: 'Hast du das Fahrkartenticket gekauft?', pronunciation: '/ˈtɪkət/', type: 'Noun', transcription: 'das tik-ket', level: 'A2', topicSlug: 'reisen-verkehr' },
  { word: 'der Flughafen', meaning: 'Sân bay', example: 'Wir fahren mit dem Taxi zum Flughafen.', pronunciation: '/ˈfluːkˌhaːfn̩/', type: 'Noun', transcription: 'der floog-hah-fen', level: 'A2', topicSlug: 'reisen-verkehr' },

  { word: 'der Arzt', meaning: 'Bác sĩ (Nam)', example: 'Der Arzt untersucht den Patienten.', pronunciation: '/aːʁtsft/', type: 'Noun', transcription: 'der ahrtst', level: 'A2', topicSlug: 'gesundheit-koerper' },
  { word: 'das Krankenhaus', meaning: 'Bệnh viện', example: 'Er liegt seit gestern im Krankenhaus.', pronunciation: '/ˈkʁaŋkn̩ˌhaʊ̯s/', type: 'Noun', transcription: 'das krahn-ken-hows', level: 'A2', topicSlug: 'gesundheit-koerper' },
  { word: 'gesund', meaning: 'Khỏe mạnh / Lành mạnh', example: 'Obst und Gemüse sind gesund.', pronunciation: '/ɡəˈzʊnt/', type: 'Adjective', transcription: 'geh-zoont', level: 'A2', topicSlug: 'gesundheit-koerper' },
  { word: 'krank', meaning: 'Bị ốm / Bệnh', example: 'Ich kann nicht kommen, weil ich krank bin.', pronunciation: '/kʁaŋk/', type: 'Adjective', transcription: 'krahnk', level: 'A2', topicSlug: 'gesundheit-koerper' },

  // B1
  { word: 'die Besprechung', meaning: 'Cuộc họp / Cuộc thảo luận công việc', example: 'Die Besprechung beginnt um 10 Uhr.', pronunciation: '/bəˈʃpʁɛçʊŋ/', type: 'Noun', transcription: 'dee beh-shpreh-khoong', level: 'B1', topicSlug: 'arbeit-beruf' },
  { word: 'der Kollege', meaning: 'Đồng nghiệp (Nam)', example: 'Mein Kollege hilft mir bei dem Projekt.', pronunciation: '/kɔˈleːɡə/', type: 'Noun', transcription: 'der kol-lay-geh', level: 'B1', topicSlug: 'arbeit-beruf' },
  { word: 'bewerben', meaning: 'Ứng tuyển / Nộp đơn xin việc', example: 'Ich möchte mich um diese Stelle bewerben.', pronunciation: '/bəˈvɛʁbn̩/', type: 'Verb', transcription: 'beh-ver-ben', level: 'B1', topicSlug: 'arbeit-beruf' },
  { word: 'das Gehalt', meaning: 'Tiền lương hàng tháng', example: 'Das Gehalt wird Ende des Monats überwiesen.', pronunciation: '/ɡəˈhalt/', type: 'Noun', transcription: 'das geh-hahlt', level: 'B1', topicSlug: 'arbeit-beruf' },
  { word: 'die Erfahrung', meaning: 'Kinh nghiệm làm việc / Trải nghiệm', example: 'Sie hat viel Erfahrung im Marketingbereich.', pronunciation: '/ɛɐ̯ˈfaːʁʊŋ/', type: 'Noun', transcription: 'dee er-fah-roong', level: 'B1', topicSlug: 'arbeit-beruf' },

  { word: 'die Wohnung', meaning: 'Căn hộ chung cư', example: 'Unsere neue Wohnung liegt im Stadtzentrum.', pronunciation: '/ˈvoːnʊŋ/', type: 'Noun', transcription: 'dee voh-noong', level: 'B1', topicSlug: 'wohnen-haushalt' },
  { word: 'die Miete', meaning: 'Tiền thuê nhà', example: 'Die Miete ist diesen Monat leider gestiegen.', pronunciation: '/ˈmiːtə/', type: 'Noun', transcription: 'dee mee-teh', level: 'B1', topicSlug: 'wohnen-haushalt' },
  { word: 'umziehen', meaning: 'Chuyển nhà', example: 'Nächste Woche ziehen wir in ein größeres Haus um.', pronunciation: '/ˈʊmˌtsiːən/', type: 'Verb', transcription: 'oom-tsee-en', level: 'B1', topicSlug: 'wohnen-haushalt' },

  { word: 'die Nachricht', meaning: 'Tin nhắn / Tin tức', example: 'Hast du meine Nachricht bekommen?', pronunciation: '/ˈnaːxˌʁɪçt/', type: 'Noun', transcription: 'dee nakh-rikht', level: 'B1', topicSlug: 'medien-kommunikation' },
  { word: 'die Zeitung', meaning: 'Tờ báo', example: 'Mein Großvater liest morgens die Zeitung.', pronunciation: '/ˈtsaɪ̯tʊŋ/', type: 'Noun', transcription: 'dee tsye-toong', level: 'B1', topicSlug: 'medien-kommunikation' },

  // B2
  { word: 'die Nachhaltigkeit', meaning: 'Sự phát triển bền vững', example: 'Nachhaltigkeit ist entscheidend für unsere Zukunft.', pronunciation: '/ˈnaːxhaltɪçkaɪ̯t/', type: 'Noun', transcription: 'dee nakh-halt-ikh-kite', level: 'B2', topicSlug: 'umwelt-politik' },
  { word: 'der Klimawandel', meaning: 'Biến đổi khí hậu global', example: 'Der Klimawandel stellt eine globale Bedrohung dar.', pronunciation: '/ˈkliːmaˌvandl̩/', type: 'Noun', transcription: 'der klee-mah-vahn-del', level: 'B2', topicSlug: 'umwelt-politik' },
  { word: 'die Energie', meaning: 'Năng lượng', example: 'Wir müssen mehr erneuerbare Energie nutzen.', pronunciation: '/enɛʁˈɡiː/', type: 'Noun', transcription: 'dee eh-ner-gee', level: 'B2', topicSlug: 'umwelt-politik' },

  { word: 'die Inflation', meaning: 'Lạm phát tiền tệ', example: 'Die Inflation führt zu höheren Lebensmittelpreisen.', pronunciation: '/ɪnflaˈtsi̯oːn/', type: 'Noun', transcription: 'dee in-flah-tsyohn', level: 'B2', topicSlug: 'wirtschaft-finanzen' },
  { word: 'die Investition', meaning: 'Khoản đầu tư / Sự đầu tư', example: 'Eine nachhaltige Investition bringt langfristigen Nutzen.', pronunciation: '/ɪnvɛstiˈtsi̯oːn/', type: 'Noun', transcription: 'dee in-ves-tee-tsyohn', level: 'B2', topicSlug: 'wirtschaft-finanzen' },

  // C1 / C2
  { word: 'die Erkenntnis', meaning: 'Nhận thức / Tri thức đạt được qua nghiên cứu', example: 'Neue wissenschaftliche Erkenntnisse verändern unsere Sichtweise.', pronunciation: '/ɛɐ̯ˈkɛntnɪs/', type: 'Noun', transcription: 'dee er-kent-nis', level: 'C1', topicSlug: 'wissenschaft-forschung' },
  { word: 'die Hypothese', meaning: 'Giả thuyết khoa học', example: 'Die Forscher überprüfen derzeit ihre Hypothese im Labor.', pronunciation: '/hypoˈteːzə/', type: 'Noun', transcription: 'dee hu-po-tay-zeh', level: 'C1', topicSlug: 'wissenschaft-forschung' },

  { word: 'die Ethik', meaning: 'Đạo đức học / Hệ giá trị chuẩn mực', example: 'Die Frage der medizinischen Ethik diskutieren Experten weltweit.', pronunciation: '/ˈeːtɪk/', type: 'Noun', transcription: 'dee ay-tik', level: 'C2', topicSlug: 'kultur-philosophie' },
  { word: 'die Ästhetik', meaning: 'Mỹ học / Tính thẩm mỹ cao', example: 'Die Ästhetik des Gebäudes verbindet Tradition und Moderne.', pronunciation: '/ɛsˈteːtɪk/', type: 'Noun', transcription: 'dee es-tay-tik', level: 'C2', topicSlug: 'kultur-philosophie' },
]

async function main() {
  console.log('🌱 Starting database seeding...')

  for (const topicData of initialTopics) {
    const topic = await prisma.topic.upsert({
      where: { slug: topicData.slug },
      update: topicData,
      create: topicData,
    })
    console.log(`✅ Topic created/updated: ${topic.name}`)
  }

  for (const wordData of initialVocabulary) {
    const { topicSlug, ...wordFields } = wordData
    const existing = await prisma.vocabularyWord.findFirst({
      where: { word: wordFields.word, level: wordFields.level },
    })

    let word
    if (existing) {
      word = await prisma.vocabularyWord.update({
        where: { id: existing.id },
        data: wordFields,
      })
    } else {
      word = await prisma.vocabularyWord.create({
        data: wordFields,
      })
    }

    if (topicSlug) {
      const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } })
      if (topic) {
        await prisma.wordTopic.upsert({
          where: {
            wordId_topicId: {
              wordId: word.id,
              topicId: topic.id,
            },
          },
          update: {},
          create: {
            wordId: word.id,
            topicId: topic.id,
          },
        })
      }
    }
    console.log(`✅ Vocabulary word created/updated: ${word.word}`)
  }

  // Seed Quiz Questions & Choices
  const begruessungTopic = await prisma.topic.findUnique({ where: { slug: 'begruessung-vorstellung' } })
  if (begruessungTopic) {
    const existingQ = await prisma.quizQuestion.findFirst({ where: { topicId: begruessungTopic.id } })
    if (!existingQ) {
      await prisma.quizQuestion.create({
        data: {
          topicId: begruessungTopic.id,
          text: '"Hallo" có nghĩa là gì trong tiếng Việt?',
          type: 'multiple_choice',
          level: 'A1',
          choices: {
            create: [
              { index: 0, text: 'Xin chào', isCorrect: true },
              { index: 1, text: 'Tạm biệt', isCorrect: false },
              { index: 2, text: 'Cảm ơn', isCorrect: false },
              { index: 3, text: 'Xin lỗi', isCorrect: false },
            ],
          },
        },
      })
      await prisma.quizQuestion.create({
        data: {
          topicId: begruessungTopic.id,
          text: 'Sắp xếp các từ thành câu chào hoàn chỉnh: "Tôi tên là Anna"',
          type: 'sentence_builder',
          level: 'A1',
          solution: 'Ich heiße Anna',
          scrambleWords: ['heiße', 'Ich', 'Anna', 'Tag'],
        },
      })
      await prisma.quizQuestion.create({
        data: {
          topicId: begruessungTopic.id,
          text: 'Nghe phát âm và gõ lại chính xác câu tiếng Đức',
          type: 'dictation',
          level: 'A1',
          targetSentence: 'Guten Tag! Ich heiße Anna.',
          solution: 'Guten Tag! Ich heiße Anna.',
        },
      })
    }
  }

  // Seed UserLessons (YouTube Video Lessons)
  const sampleLessons = [
    {
      title: 'Nicos Weg - A1 Deutsch lernen: Die Ankunft in Deutschland',
      youtubeId: '4-eDoThe6qo',
      url: 'https://www.youtube.com/watch?v=4-eDoThe6qo',
      level: 'A1',
      thumbnail: 'https://img.youtube.com/vi/4-eDoThe6qo/hqdefault.jpg',
      description: 'Bài học video nhập môn dành cho người bắt đầu học tiếng Đức A1 cùng Nico.',
    },
    {
      title: 'Easy German - Wie geht es dir? Smalltalk im Alltag',
      youtubeId: 'q_J6wW6t_aM',
      url: 'https://www.youtube.com/watch?v=q_J6wW6t_aM',
      level: 'A2',
      thumbnail: 'https://img.youtube.com/vi/q_J6wW6t_aM/hqdefault.jpg',
      description: 'Luyện giao tiếp phản xạ hỏi thăm sức khỏe và hội thoại hàng ngày ở Đức.',
    },
    {
      title: 'Deutsch im Beruf - Vorstellungsgespräch auf Deutsch',
      youtubeId: 'bg44z1-XWnQ',
      url: 'https://www.youtube.com/watch?v=bg44z1-XWnQ',
      level: 'B1',
      thumbnail: 'https://img.youtube.com/vi/bg44z1-XWnQ/hqdefault.jpg',
      description: 'Bài học từ vựng và hội thoại phỏng vấn xin việc bằng tiếng Đức trình độ B1.',
    },
  ]

  for (const lessonData of sampleLessons) {
    const existing = await prisma.userLesson.findFirst({
      where: { youtubeId: lessonData.youtubeId },
    })
    if (!existing) {
      await prisma.userLesson.create({ data: lessonData })
    }
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

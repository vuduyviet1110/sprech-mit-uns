/** @typedef {{ word: string, meaning: string, example: string, type: string }} RawWord */

/** German A1–B1 topic definitions (12) */
export const topicsDe = [
  {
    name: 'Begrüßung & Vorstellung',
    slug: 'begruessung-vorstellung',
    level: 'A1',
    language: 'de',
    description: 'Các mẫu câu chào hỏi, tự giới thiệu bản thân và giao tiếp cơ bản hàng ngày.',
    paragraph:
      'Guten Tag! Ich heiße Anna und komme aus Deutschland. Ich wohne in Berlin und lerne Deutsch. Freut mich, Sie kennenzulernen!',
    englishTranslation:
      'Xin chào! Tôi tên là Anna và đến từ Đức. Tôi sống ở Berlin và đang học tiếng Đức. Rất vui được làm quen!',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 1,
    prerequisiteSlug: null,
  },
  {
    name: 'Essen & Trinken',
    slug: 'essen-trinken',
    level: 'A1',
    language: 'de',
    description: 'Từ vựng món ăn, thức uống và cách gọi món tại nhà hàng.',
    paragraph:
      'Ich hätte gerne einen Kaffee und ein Stück Kuchen, bitte. Das Essen schmeckt sehr lecker. Die Rechnung, bitte!',
    englishTranslation:
      'Tôi muốn một tách cà phê và một miếng bánh. Món ăn rất ngon. Xin hóa đơn ạ!',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 2,
    prerequisiteSlug: 'begruessung-vorstellung',
  },
  {
    name: 'Familie & Freunde',
    slug: 'familie-freunde',
    level: 'A1',
    language: 'de',
    description: 'Gia đình, bạn bè và mô tả người.',
    paragraph:
      'Meine Familie ist nicht sehr groß. Ich habe einen Bruder und eine Schwester. Meine Freunde sind sehr nett.',
    englishTranslation:
      'Gia đình tôi không lớn lắm. Tôi có một anh trai và một em gái. Bạn bè tôi rất tốt.',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 3,
    prerequisiteSlug: 'essen-trinken',
  },
  {
    name: 'Zahlen & Zeit',
    slug: 'zahlen-zeit',
    level: 'A1',
    language: 'de',
    description: 'Số đếm, giờ giấc, ngày trong tuần và thời gian.',
    paragraph:
      'Es ist jetzt acht Uhr morgens. Am Montag habe ich um zehn Uhr einen Termin. Wie spät ist es bei dir?',
    englishTranslation:
      'Bây giờ là 8 giờ sáng. Thứ Hai tôi có lịch hẹn lúc 10 giờ. Ở chỗ bạn là mấy giờ?',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 4,
    prerequisiteSlug: 'familie-freunde',
  },
  {
    name: 'Einkaufen & Kleidung',
    slug: 'einkaufen-kleidung',
    level: 'A2',
    language: 'de',
    description: 'Mua sắm, trang phục, giá cả và thanh toán.',
    paragraph:
      'Wie viel kostet diese blaue Jacke? Kann ich mit Kreditkarte bezahlen? Die Hose ist etwas zu teuer.',
    englishTranslation:
      'Áo khoác xanh này giá bao nhiêu? Tôi có thể trả bằng thẻ không? Chiếc quần hơi đắt.',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 5,
    prerequisiteSlug: 'zahlen-zeit',
  },
  {
    name: 'Reisen & Verkehr',
    slug: 'reisen-verkehr',
    level: 'A2',
    language: 'de',
    description: 'Du lịch, giao thông, hỏi đường và đặt phòng.',
    paragraph:
      'Der Zug nach Berlin fährt von Gleis 4 ab. Die Fahrt dauert etwa zwei Stunden. Wo ist der Bahnhof?',
    englishTranslation:
      'Tàu đi Berlin khởi hành từ đường ray số 4. Chuyến đi mất khoảng hai giờ. Nhà ga ở đâu?',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 6,
    prerequisiteSlug: 'einkaufen-kleidung',
  },
  {
    name: 'Gesundheit & Körper',
    slug: 'gesundheit-koerper',
    level: 'A2',
    language: 'de',
    description: 'Cơ thể, triệu chứng bệnh và khám bác sĩ.',
    paragraph:
      'Ich habe Kopfschmerzen und Fieber. Ich muss einen Termin beim Arzt machen. Bitte helfen Sie mir!',
    englishTranslation:
      'Tôi bị đau đầu và sốt. Tôi cần đặt lịch khám bác sĩ. Xin hãy giúp tôi!',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 7,
    prerequisiteSlug: 'reisen-verkehr',
  },
  {
    name: 'Wohnen & Alltag',
    slug: 'wohnen-alltag',
    level: 'A2',
    language: 'de',
    description: 'Nhà cửa, đồ dùng hàng ngày và thói quen.',
    paragraph:
      'Meine Wohnung hat zwei Zimmer und eine Küche. Jeden Morgen trinke ich Kaffee und lese die Nachrichten.',
    englishTranslation:
      'Căn hộ của tôi có hai phòng và một bếp. Mỗi sáng tôi uống cà phê và đọc tin tức.',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 8,
    prerequisiteSlug: 'gesundheit-koerper',
  },
  {
    name: 'Arbeit & Beruf',
    slug: 'arbeit-beruf',
    level: 'B1',
    language: 'de',
    description: 'Công việc, đồng nghiệp và ứng tuyển.',
    paragraph:
      'Die Besprechung beginnt um zehn Uhr. Mein Kollege hilft mir bei dem Projekt. Ich möchte mich um diese Stelle bewerben.',
    englishTranslation:
      'Cuộc họp bắt đầu lúc mười giờ. Đồng nghiệp giúp tôi với dự án. Tôi muốn ứng tuyển vị trí này.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 9,
    prerequisiteSlug: 'wohnen-alltag',
  },
  {
    name: 'Wohnen & Haushalt',
    slug: 'wohnen-haushalt',
    level: 'B1',
    language: 'de',
    description: 'Thuê nhà, chuyển nhà và việc nhà.',
    paragraph:
      'Unsere neue Wohnung liegt im Stadtzentrum. Die Miete ist gestiegen. Nächste Woche ziehen wir um.',
    englishTranslation:
      'Căn hộ mới nằm ở trung tâm. Tiền thuê đã tăng. Tuần sau chúng tôi chuyển nhà.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 10,
    prerequisiteSlug: 'arbeit-beruf',
  },
  {
    name: 'Medien & Kommunikation',
    slug: 'medien-kommunikation',
    level: 'B1',
    language: 'de',
    description: 'Tin tức, mạng xã hội và giao tiếp hiện đại.',
    paragraph:
      'Hast du meine Nachricht bekommen? Mein Großvater liest morgens die Zeitung. Ich schaue oft Nachrichten online.',
    englishTranslation:
      'Bạn nhận được tin nhắn của tôi chưa? Ông tôi đọc báo vào buổi sáng. Tôi thường xem tin tức online.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 11,
    prerequisiteSlug: 'wohnen-haushalt',
  },
  {
    name: 'Umwelt & Gesellschaft',
    slug: 'umwelt-gesellschaft',
    level: 'B1',
    language: 'de',
    description: 'Môi trường, xã hội và chủ đề đời sống hiện đại.',
    paragraph:
      'Nachhaltigkeit ist wichtig für unsere Zukunft. Wir sollten mehr öffentliche Verkehrsmittel nutzen und weniger Plastik verwenden.',
    englishTranslation:
      'Phát triển bền vững quan trọng cho tương lai. Chúng ta nên dùng nhiều phương tiện công cộng hơn và ít nhựa hơn.',
    difficulty: 'Hard',
    estimatedTime: '30 mins',
    sortOrder: 12,
    prerequisiteSlug: 'medien-kommunikation',
  },
]

/** Czech A1–B1 mirror topics (12) */
export const topicsCs = [
  {
    name: 'Pozdravy & Představení',
    slug: 'pozdravy-predstaveni-cs',
    level: 'A1',
    language: 'cs',
    description: 'Chào hỏi, tự giới thiệu và giao tiếp cơ bản tiếng Séc.',
    paragraph:
      'Dobrý den! Jmenuji se Anna a pocházím z Česka. Bydlím v Praze a učím se češtinu. Těší mě!',
    englishTranslation:
      'Xin chào! Tôi tên Anna và đến từ Cộng hòa Séc. Tôi sống ở Praha và đang học tiếng Séc. Rất vui được gặp!',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 1,
    prerequisiteSlug: null,
  },
  {
    name: 'Jídlo & Pití',
    slug: 'jidlo-piti-cs',
    level: 'A1',
    language: 'cs',
    description: 'Đồ ăn, thức uống và gọi món.',
    paragraph:
      'Dal bych si kávu a kousek dortu, prosím. Jídlo je velmi dobré. Účet, prosím!',
    englishTranslation:
      'Cho tôi một cà phê và một miếng bánh. Món ăn rất ngon. Xin hóa đơn!',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 2,
    prerequisiteSlug: 'pozdravy-predstaveni-cs',
  },
  {
    name: 'Rodina & Přátelé',
    slug: 'rodina-pratele-cs',
    level: 'A1',
    language: 'cs',
    description: 'Gia đình và bạn bè.',
    paragraph:
      'Moje rodina není moc velká. Mám bratra a sestru. Moji přátelé jsou milí.',
    englishTranslation:
      'Gia đình tôi không lớn lắm. Tôi có anh trai và em gái. Bạn bè tôi rất tốt.',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 3,
    prerequisiteSlug: 'jidlo-piti-cs',
  },
  {
    name: 'Čísla & Čas',
    slug: 'cisla-cas-cs',
    level: 'A1',
    language: 'cs',
    description: 'Số đếm, giờ giấc và ngày.',
    paragraph:
      'Je teď osm hodin ráno. V pondělí mám schůzku v deset. Kolik je u tebe hodin?',
    englishTranslation:
      'Bây giờ là 8 giờ sáng. Thứ Hai tôi có lịch lúc 10 giờ. Ở chỗ bạn mấy giờ?',
    difficulty: 'Easy',
    estimatedTime: '20 mins',
    sortOrder: 4,
    prerequisiteSlug: 'rodina-pratele-cs',
  },
  {
    name: 'Nakupování & Oblečení',
    slug: 'nakupovani-obleceni-cs',
    level: 'A2',
    language: 'cs',
    description: 'Mua sắm và quần áo.',
    paragraph:
      'Kolik stojí tato modrá bunda? Mohu platit kartou? Ty kalhoty jsou trochu drahé.',
    englishTranslation:
      'Áo khoác xanh này giá bao nhiêu? Tôi có thể trả thẻ không? Chiếc quần hơi đắt.',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 5,
    prerequisiteSlug: 'cisla-cas-cs',
  },
  {
    name: 'Cestování & Doprava',
    slug: 'cestovani-doprava-cs',
    level: 'A2',
    language: 'cs',
    description: 'Du lịch và giao thông.',
    paragraph:
      'Vlak do Brna odjíždí z koleje 4. Cesta trvá asi dvě hodiny. Kde je nádraží?',
    englishTranslation:
      'Tàu đi Brno khởi hành từ đường ray 4. Chuyến đi khoảng hai giờ. Nhà ga ở đâu?',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 6,
    prerequisiteSlug: 'nakupovani-obleceni-cs',
  },
  {
    name: 'Zdraví & Tělo',
    slug: 'zdravi-telo-cs',
    level: 'A2',
    language: 'cs',
    description: 'Sức khỏe và cơ thể.',
    paragraph:
      'Bolí mě hlava a mám horečku. Musím si domluvit schůzku u doktora. Prosím, pomozte mi!',
    englishTranslation:
      'Tôi đau đầu và sốt. Tôi cần đặt lịch bác sĩ. Xin hãy giúp tôi!',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 7,
    prerequisiteSlug: 'cestovani-doprava-cs',
  },
  {
    name: 'Bydlení & Každodennost',
    slug: 'bydleni-kazdodennost-cs',
    level: 'A2',
    language: 'cs',
    description: 'Nhà ở và sinh hoạt hàng ngày.',
    paragraph:
      'Můj byt má dva pokoje a kuchyň. Každé ráno piju kávu a čtu zprávy.',
    englishTranslation:
      'Căn hộ tôi có hai phòng và bếp. Mỗi sáng tôi uống cà phê và đọc tin.',
    difficulty: 'Medium',
    estimatedTime: '25 mins',
    sortOrder: 8,
    prerequisiteSlug: 'zdravi-telo-cs',
  },
  {
    name: 'Práce & Povolání',
    slug: 'prace-povolani-cs',
    level: 'B1',
    language: 'cs',
    description: 'Công việc và nghề nghiệp.',
    paragraph:
      'Schůzka začíná v deset. Kolega mi pomáhá s projektem. Chci se přihlásit na tuto pozici.',
    englishTranslation:
      'Cuộc họp bắt đầu lúc mười giờ. Đồng nghiệp giúp tôi với dự án. Tôi muốn ứng tuyển vị trí này.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 9,
    prerequisiteSlug: 'bydleni-kazdodennost-cs',
  },
  {
    name: 'Domácnost & Nájem',
    slug: 'domacnost-najem-cs',
    level: 'B1',
    language: 'cs',
    description: 'Thuê nhà và việc nhà.',
    paragraph:
      'Náš nový byt je v centru města. Nájemné stouplo. Příští týden se stěhujeme.',
    englishTranslation:
      'Căn hộ mới ở trung tâm. Tiền thuê tăng. Tuần sau chúng tôi chuyển nhà.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 10,
    prerequisiteSlug: 'prace-povolani-cs',
  },
  {
    name: 'Média & Komunikace',
    slug: 'media-komunikace-cs',
    level: 'B1',
    language: 'cs',
    description: 'Truyền thông và giao tiếp.',
    paragraph:
      'Dostal jsi mou zprávu? Dědeček ráno čte noviny. Často sleduji zprávy online.',
    englishTranslation:
      'Bạn nhận tin nhắn của tôi chưa? Ông tôi đọc báo buổi sáng. Tôi thường xem tin online.',
    difficulty: 'Medium',
    estimatedTime: '30 mins',
    sortOrder: 11,
    prerequisiteSlug: 'domacnost-najem-cs',
  },
  {
    name: 'Životní prostředí & Společnost',
    slug: 'zivotni-prostredi-spolecnost-cs',
    level: 'B1',
    language: 'cs',
    description: 'Môi trường và xã hội.',
    paragraph:
      'Udržitelnost je důležitá pro naši budoucnost. Měli bychom více používat veřejnou dopravu a méně plastů.',
    englishTranslation:
      'Phát triển bền vững quan trọng cho tương lai. Chúng ta nên dùng nhiều giao thông công cộng hơn và ít nhựa hơn.',
    difficulty: 'Hard',
    estimatedTime: '30 mins',
    sortOrder: 12,
    prerequisiteSlug: 'media-komunikace-cs',
  },
]

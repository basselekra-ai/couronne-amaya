'use strict';
/* Scénario, indices, « Le saviez-vous ? », quiz et réglages des mini-jeux.

   Langage des scripts (une instruction par ligne) :
     @bg <décor> [jour|soir|nuit]   @music <thème|none>   @place <texte>   @title
     @game <id>   @clue <id>   @fact <id>   @key <n>   @sfx <son>   @wait <ms>
     @shake   @flash   @danger on|off   @exit   @phone off   @photo hostage|guardians
     @label <nom>   @goto <nom>   @if <condition> <nom>   @set <drapeau>   @trust +1|-1
     @ending lumiere|aube   @end
     >  narration          >> narration en grand
     perso.humeur: réplique             (*mot* = mot mis en valeur)
     sms:<contact> message              sms>me message envoyé par Awa
     ? question  (ou ?!8 question : 8 secondes pour choisir, sinon la dernière option)
     - texte de l'option => set x ; trust +1 ; goto etiquette
   Conditions : drapeau, !drapeau, trust>=2, frags>=7, combinées par &. */

const CHAPTERS = [
  {
    id: 'dakar', num: 1, city: 'Dakar', country: 'Sénégal', flag: 'sn', ll: [-17.45, 14.69], sub: 'La kora silencieuse',
    desc: 'Papi Seydou, le vieux griot de la Médina, a disparu. Dans sa maison saccagée, il a laissé des traces que lui seul pouvait cacher.',
    script: `
@bg chambre
@music tension
@place Dakar · La Médina
@title
>> Dakar. 23 h 47.
> Trois heures plus tôt, Awa a reçu un message de son grand-père.
sms:papi Awa, viens vite à la maison. Ne parle à personne.
sms:papi Personne. Tu m'entends ?
@phone off
> La porte de la maison familiale est entrouverte. La lumière, éteinte.
awa.inquiet: Papi ? C'est moi, Awa…
awa.peur: Tout est retourné… Les livres, le lit… Sa *kora* !
@sfx stinger
@shake
awa.colere: Quelqu'un est passé avant moi. Et il cherchait quelque chose.
awa.determine: Réfléchis, Awa. Papi laisse toujours des traces. *Toujours*.
@game fouille_chambre
awa.inquiet: Une photo déchirée… « Les Sept — Le Caire, 1987 ». Papi est là, avec des inconnus. Un des visages a été arraché.
@clue photo
awa.surpris: Et cette lettre : « Seydou, réfléchis à mon offre. Le prix sera le tien. — I. »
@clue lettre
awa.malin: I… Qui signe d'une seule lettre ?
@clue carnet
awa.neutre: Son carnet : « Sept portes. Sept gardiens. Une seule mémoire. » Papi, dans quoi t'es-tu embarqué ?
@fact dakar_ataya
awa.surpris: Et cette cassette… Avec mon nom dessus, écrit de sa main.
@clue cassette
@sfx page
> Awa glisse la cassette dans le vieux poste. Un souffle. Puis sa voix.
@music calme
seydou.triste: Awa, sama doom… Si tu écoutes ceci, c'est qu'ils m'ont trouvé.
seydou.neutre: Je suis l'un des *Sept*. Des gardiens. Depuis quarante ans, nous protégeons un secret plus vieux que nos royaumes.
seydou.determine: Ne me cherche pas. Cherche ce qu'*ils* cherchent. Et ne fais confiance à personne.
seydou.sourire: Rappelle-toi la berceuse que je te chantais. Elle ouvre ce que les yeux ne voient pas.
@exit
awa.triste: La berceuse… Celle qu'il jouait à la kora quand j'étais petite.
awa.determine: La calebasse est fendue, mais les cordes tiennent encore. Essayons.
@game kora_berceuse
@sfx reveal
> Au dernier accord, la calebasse de la kora s'ouvre en deux. À l'intérieur, roulé dans un tissu indigo : un médaillon de bronze.
@key 1
awa.surpris: Un baobab… et le chiffre un. La *première clé*.
@sfx sms
sms:hibou Ils reviennent. Sors. MAINTENANT.
awa.peur: Qui… qui m'écrit ?
@phone off
@sfx door
@shake
@danger on
@music tension
agent.colere: Fouillez encore ! Le vieux l'a cachée ici, j'en suis sûr !
?!7 Des pas dans le couloir. Vite !
- Sauter par la fenêtre => goto fenetre
- Se cacher sous le lit et écouter => set ecoute ; goto lit
@label lit
> Awa se glisse sous le lit. Une paire de bottes s'arrête à vingt centimètres de son visage.
@sfx heart
@wait 700
@sfx heart
agent.neutre: Le Collectionneur veut cette clé avant Bamako. Le vieux a parlé d'une femme, là-bas…
@clue bamako
agent.colere: Attends. Le lit… Il y a quelqu'un !
@goto fuite
@label fenetre
> Awa enjambe la fenêtre et retombe dans la ruelle. Une lampe torche balaie le mur, juste au-dessus d'elle.
agent.colere: Là ! Elle a la clé !
@label fuite
@exit
@bg dakar nuit
@place Dakar · Les ruelles de la Médina
@game poursuite_medina
@danger off
@music calme
@bg dakar soir
@place Dakar · Monument de la Renaissance · 6 h 10
> L'aube se lève sur les collines des Mamelles. Awa a couru toute la nuit.
@fact dakar_monument
ibrahima.inquiet: Awa ! Dieu merci, tu es entière !
awa.surpris: Tonton Ibrahima ? Comment m'as-tu trouvée ?
ibrahima.sourire: Ton grand-père m'a appelé hier soir. Il avait peur. Il m'a dit : « Si quelque chose m'arrive, veille sur Awa. »
> Tonton Ibrahima lui serre les mains. Sa grosse chevalière est froide contre ses doigts.
ibrahima.neutre: Seydou et moi, c'est quarante ans d'amitié. Je ferai tout pour le retrouver.
? Que réponds-tu ?
- « Merci, Tonton. Je ne sais plus à qui me fier. » => goto merci
- « Il t'a appelé ? Pourtant, il m'a écrit de ne parler à personne… » => set doute ; goto doute
@label doute
ibrahima.inquiet: Justement : je ne suis pas « personne », je suis presque son frère.
ibrahima.sourire: Allons, tu es fatiguée. Tu vois des ennemis partout. C'est normal.
@goto cadeau
@label merci
ibrahima.sourire: Tu peux te fier à moi. Toujours.
@label cadeau
ibrahima.neutre: Ces gens peuvent suivre ton téléphone. Prends celui-ci, il est neuf. Et ce billet : Bamako, vol de 9 h.
@clue telephone
@clue billet
ibrahima.neutre: Seydou m'a souvent parlé de Fanta Coulibaly, au Musée national. Va la voir. Et appelle-moi à chaque étape, d'accord ?
awa.sourire: D'accord, Tonton. Jërëjëf.
@exit
@fact dakar_ouest
@sfx sms
sms:hibou La première porte est ouverte. Six restent. Bamako. Le fleuve se souvient.
sms>me Qui êtes-vous ?
sms:hibou Un ami de ton grand-père. Garde la clé contre ton cœur.
sms:hibou Et méfie-toi des cadeaux.
@phone off
awa.inquiet: Méfie-toi des cadeaux…
@bg dakar nuit
@music tension
@place Quelque part à Dakar…
masque.neutre: Elle a la première clé.
masque.malin: Laissez-la courir. Elle nous mènera aux six autres.
@end`,
  },
  {
    id: 'bamako', num: 2, city: 'Bamako', country: 'Mali', flag: 'ml', ll: [-8.0, 12.64], sub: 'Le fleuve se souvient',
    desc: 'Au bord du Niger, une gardienne a laissé un coffre que personne n\'a jamais su ouvrir. Et les hommes gris sont déjà en ville.',
    script: `
@bg avion
@music calme
>> Vol Dakar – Bamako
awa.inquiet: (Six clés. Six villes. Et Papi, quelque part.)
@bg bamako jour
@music sahel
@place Bamako · Le fleuve Niger
@title
> Bamako. 41 °C à l'ombre. Le Niger coule, large et lent, au pied de la ville.
@fact bamako_nom
ibrahima.sourire: Allô ? Bien arrivée ? Parfait. Fanta est quelqu'un de fiable, tu peux lui parler.
ibrahima.neutre: Appelle-moi dès que tu as du nouveau. Je m'inquiète pour toi.
@exit
@bg musee
@place Bamako · Musée national du Mali
fanta.neutre: Le musée ferme dans dix minutes. Revenez demain.
awa.neutre: Je cherche Fanta Coulibaly. C'est urgent.
fanta.colere: Vous l'avez trouvée. Et vous êtes la troisième personne à me la demander aujourd'hui. Les deux autres portaient des *gants gris*.
? Comment gagner sa confiance ?
- Lui montrer discrètement le médaillon du baobab => goto montre
- « Je suis la petite-fille de Seydou Ndiaye. » => goto nom
@label montre
fanta.surpris: La clé de Dakar… Range ça ! Ici, même les murs ont des oreilles.
@goto ensemble
@label nom
fanta.malin: Le griot de Dakar ? Alors réponds : que chante la kora quand le griot se tait ?
awa.determine: … La berceuse. Celle qui ouvre ce que les yeux ne voient pas.
fanta.surpris: Ce sont les mots de ma mère. Viens, vite.
@label ensemble
fanta.triste: Ma mère, Mariam, était la gardienne de Bamako. Elle est partie l'an dernier. Elle m'a laissé ce coffre… et une seule phrase.
fanta.neutre: « Le fleuve se souvient de chaque pierre. » Je n'ai jamais réussi à l'ouvrir.
awa.surpris: Ce cadenas… Ce sont des signes de *bogolan* !
@fact bogolan
fanta.sourire: Ma mère disait que le bogolan est une écriture. Le fleuve d'abord, la pierre à la fin. Le reste, c'est à nous de le trouver.
@game cadenas_bogolan
@sfx reveal
> Le cadenas cède. Dans le coffre : un médaillon, et une lettre jaunie.
@key 2
awa.surpris: Un caïman. La *deuxième clé*.
fanta.triste: Et l'écriture de ma mère…
> « En 1324, l'empereur Mansa Musa traversa le désert jusqu'au Caire. Ses griots emportaient un livre : la mémoire de tous les peuples du fleuve et des rivages. *Le Livre des Rives*. »
> « Pour le protéger, sept gardiens se partagèrent sept clés. Si l'un tombe, les autres doivent tenir. »
@clue lettre_mariam
@fact mansa_musa
awa.surpris: Le Livre des Rives… C'est ça qu'ils veulent.
fanta.peur: Et ils sont là.
@sfx alarm
@shake
@danger on
@music action
agent.colere: Personne ne sort ! Donnez-nous le coffre !
fanta.determine: Par la réserve ! Ma pirogue est amarrée derrière le musée !
@exit
@bg bamako jour
@place Bamako · Sur le Niger
@game pirogue_niger
@danger off
@music sahel
@bg bamako soir
@place Bamako · Le soir tombe
> Le soleil se couche sur le Niger. Les poursuivants ont disparu derrière les bancs de sable.
fanta.sourire: Tu rames comme une fille du fleuve, Awa.
awa.sourire: J'ai eu une bonne professeure.
fanta.neutre: Ma mère parlait souvent d'un ami à Yamoussoukro. Un vieux sage qui veille sur les crocodiles sacrés : *Nanan Kouamé*.
fanta.determine: « Les crocodiles gardent ce que les hommes oublient. » Va là-bas. Moi, je les retiens ici.
@exit
@sfx smsBad
sms:gris Joli tour de pirogue, Awa.
sms:gris Ton grand-père te passe le bonjour.
awa.peur: Ils ont… mon numéro. Mon *nouveau* numéro.
@clue numero
? Leur répondre ?
- « Où est mon grand-père ?! » => set repondu ; goto rep
- Ne rien répondre => goto norep
@label rep
sms>me Où est mon grand-père ?!
sms:gris Apporte-nous les sept clés et tu le reverras. Nous te dirons où. Le moment venu.
@goto fin
@label norep
awa.determine: (Ne rien leur donner. Pas même un mot.)
@label fin
@phone off
@end`,
  },
  {
    id: 'yamoussoukro', num: 3, city: 'Yamoussoukro', country: "Côte d'Ivoire", flag: 'ci', ll: [-5.27, 6.82], sub: 'Les gardiens du lac',
    desc: 'Le vieux gardien des crocodiles sacrés ne répond plus. Chaque nuit, des lampes torches balaient les rives du lac.',
    script: `
@bg route
@music lagune
>> Route Bamako – Yamoussoukro. 14 heures de car.
awa.neutre: (Le fleuve, les crocodiles… Les gardiens parlaient comme des devinettes.)
@bg yamoussoukro soir
@place Yamoussoukro · Au bord du lac
@title
> Yamoussoukro, capitale politique de la Côte d'Ivoire. Au loin, le dôme immense de la basilique Notre-Dame de la Paix.
@fact yakro_capitale
akissi.sourire: Akwaba, ma sœur ! Tu cherches quelqu'un ? Tu as l'air perdue comme un gaou au grand marché !
awa.sourire: Je cherche Nanan Kouamé. Le gardien des crocodiles.
akissi.inquiet: Hééé… Nanan, c'est mon grand-père. Mais depuis deux jours, il ne répond plus. Et des hommes en gris tournent autour du lac, la nuit.
awa.determine: Les mêmes qui ont enlevé le mien.
akissi.colere: Ah non, là c'est gâté ! On ne touche pas à Nanan. Toi et moi, on est ensemble.
@fact basilique
akissi.neutre: Chaque soir, Nanan nourrit les crocodiles sacrés. Il connaît chaque pierre du lac. S'il a caché quelque chose, c'est là-bas.
@bg yamoussoukro nuit
@music tension
@place Yamoussoukro · Minuit
> Minuit. Des lampes torches balaient les rives. Les hommes gris gardent l'enclos du lac.
akissi.inquiet: Ils regardent chacun dans une direction. Passe dans leur dos, et cache-toi dans les buissons.
@game infiltration_lac
@music lagune
> Dans une cabane de pêcheur, ligoté mais vivant : Nanan Kouamé.
nanan.sourire: Petites… Les crocodiles m'ont mieux gardé que les hommes. Ces gens-là n'osaient pas approcher de l'eau.
akissi.triste: Nanan ! Ils t'ont fait du mal ?
nanan.neutre: Rien qu'un vieil homme ne puisse supporter. Et ils n'ont pas trouvé ce qu'ils cherchaient.
@fact crocodiles
nanan.malin: C'est sous la pierre où je pose la viande, chaque soir. Aucun voleur n'y met la main.
@key 3
awa.surpris: Un éléphant. La *troisième clé*.
nanan.inquiet: Seydou est passé ici il y a cinq jours. Il allait vers Accra. Il avait peur, petite.
nanan.triste: Pas des hommes gris. Il avait peur… *d'un ami*.
awa.inquiet: D'un ami ?
nanan.neutre: Il n'a pas dit de nom. Seulement : « Celui qui était avec nous au Caire. »
@clue ami_caire
@exit
@sfx sms
sms:hibou Ils t'attendent à l'aéroport d'Abidjan. Ne prends pas l'avion.
sms:hibou Prends la route de la côte. Accra. Cherche la tisserande.
@phone off
akissi.sourire: La route ? Y a fohi ! Mon cousin conduit un car pour Accra. Départ à 5 heures. Va dormir un peu, ma sœur.
? Avant de partir…
- Appeler Tonton Ibrahima pour le rassurer => set appel ; goto appel
- Ne prévenir personne => goto silence
@label appel
ibrahima.sourire: Accra ? Très bonne idée, Awa. Prudente, comme ton grand-père.
@goto fin
@label silence
awa.determine: (Moins de gens savent où je suis, mieux c'est.)
@label fin
@end`,
  },
  {
    id: 'accra', num: 4, city: 'Accra', country: 'Ghana', flag: 'gh', ll: [-0.19, 5.6], sub: 'Le fil d\'or',
    desc: 'Une tisserande de kente a été blessée. Son neveu, un jeune ingénieur en colère, garde son atelier comme une forteresse.',
    script: `
@bg accra jour
@music ville
@place Accra · Jamestown
@title
> Accra. L'air sent le sel et le poisson grillé. Sous le phare rouge et blanc de Jamestown, les pirogues rentrent de la pêche.
@fact accra_independance
kofi.colere: Si vous êtes encore une de ces personnes en gris, partez avant que j'appelle tout le quartier.
awa.surpris: Je ne suis pas… Je cherche une tisserande. Je m'appelle Awa Ndiaye.
kofi.surpris: Ndiaye ? Comme *Seydou* Ndiaye ? Le griot ?
kofi.triste: Ma tante Esi parlait de lui. Esi Mensah, elle tisse le kente depuis cinquante ans. Hier, ils l'ont poussée dans l'escalier. Elle est à l'hôpital.
awa.triste: Je suis désolée… Ils ont enlevé mon grand-père.
kofi.determine: Kofi Mensah. Ingénieur, pilote de drone, et neveu très en colère. Chale, si tu cherches ce que je crois, l'atelier de ma tante est par là.
@bg atelier
@place Accra · L'atelier d'Esi
@game fouille_atelier
awa.surpris: La même photo que chez Papi ! Mais celle-ci est *intacte*…
@clue photo_complete
kofi.neutre: Huit personnes. Ma tante, là. Ton grand-père, avec la calotte blanche.
awa.inquiet: Et celui qu'on avait arraché chez Papi… Un homme en costume. On ne voit pas bien son visage. Juste une bague, à sa main.
@clue bague
kofi.malin: Une chevalière avec une main grise. Joli bijou, pour un méchant.
awa.inquiet: (Cette bague… Je l'ai déjà sentie quelque part. Froide contre mes doigts.)
@clue croquis
kofi.neutre: Et ce croquis, c'est le motif préféré de ma tante. Elle dit toujours : « Quand le tissu est juste, il parle. »
awa.determine: Alors faisons-le parler. Le métier à tisser est encore monté.
@fact kente
@game kente_esi
@sfx reveal
> La dernière bande glisse en place. Le motif dessine une flèche d'or, pointée vers l'ensouple du métier. Dedans : un médaillon.
@key 4
awa.surpris: Une étoile. La *quatrième clé*.
kofi.neutre: Il y a aussi une carte postale. « Kinshasa. Le fleuve le plus profond garde la cinquième. Demande Papa Lukusa. »
@clue carte_kin
@fact cercueils
@music tension
kofi.inquiet: Attends. Tu entends ? Une voiture s'arrête devant l'atelier.
kofi.colere: Ils t'ont suivie depuis la Côte d'Ivoire ? Qui savait que tu venais ici ?
@if appel prevenu
awa.inquiet: Personne. Je n'ai prévenu personne ! Comment font-ils pour toujours me trouver ?
@goto tel
@label prevenu
awa.inquiet: Seulement Tonton Ibrahima… Mais il est de notre côté.
@label tel
kofi.malin: Ton téléphone chauffe beaucoup, non ? Fais voir.
? Laisser Kofi examiner ton téléphone ?
- « Tiens. Je te fais confiance. » => trust +1 ; set kofi_tel ; goto oui
- « Non. C'est un cadeau de mon oncle. » => trust -1 ; goto non
@label oui
kofi.neutre: Rien de visible… Il faudrait l'ouvrir, avec de vrais outils. Je garde l'idée en tête.
@goto fin
@label non
kofi.neutre: Comme tu veux. Mais moi, je garde un œil dessus.
@label fin
kofi.determine: Par l'arrière-cour. Mon drone nous ouvre la route. Et je viens avec toi à Kinshasa : ils ont touché à ma tante.
@end`,
  },
  {
    id: 'kinshasa', num: 5, city: 'Kinshasa', country: 'RD Congo', flag: 'cd', ll: [15.27, -4.32], sub: 'Rumba pour une clé',
    desc: 'Un vieux guitariste de rumba cache la cinquième clé. Ce soir, il joue à Matonge… et les hommes gris sont déjà dans la salle.',
    script: `
@bg kinshasa soir
@music ville
@place Kinshasa · Au bord du fleuve Congo
@title
> Kinshasa. En face, de l'autre côté du fleuve, les lumières de Brazzaville. Deux capitales qui se regardent.
@fact kin_brazza
didi.sourire: Mbote, mes enfants ! Ya Didi, pour vous servir. Le plus élégant de Matonge… et peut-être du monde.
kofi.surpris: C'est… un costume *rose* ?
didi.malin: Rose bonbon, mon petit. Ici, la sape est une religion. Un homme bien habillé ne peut pas être un homme mauvais.
didi.neutre: Papa Lukusa joue ce soir au club. Mais les hommes gris sont déjà dans la salle. Ils attendent que quelqu'un s'approche de sa guitare.
awa.determine: Alors on ne s'approche pas comme des visiteurs. On monte *sur scène*.
didi.sourire: Ha ! Elle me plaît, celle-là. Vous savez tenir un rythme ?
@exit
@bg club
@music none
@place Kinshasa · Un club de Matonge
@fact rumba
@game rythme_club
@music rumba
> La salle explose. Sous les applaudissements, Papa Lukusa glisse sa guitare entre les mains d'Awa.
lukusa.sourire: La petite-fille de mon frère Seydou… Tu as son sens du rythme. C'est dans la caisse, petite. Depuis 1987.
@key 5
awa.surpris: Un léopard. La *cinquième clé* !
kofi.sourire: Plus que deux, Awa !
@exit
@music none
@sfx sms
sms:hibou Bravo, sama doom. Il ne reste que deux portes. Addis-Abeba, puis le C—
@sfx smsBad
@sfx stinger
@flash
sms:gris Ton hibou ne chantera plus.
@photo hostage
sms:gris Les sept clés contre ton grand-père. Le Caire. Tu as 72 heures.
@clue otage
@phone off
awa.peur: Papi…
awa.surpris: « Sama doom »… Le Hibou. C'était *lui*. Depuis le début, c'était Papi qui m'écrivait.
@music tension
kofi.inquiet: Awa… Les hommes gris. Ils bloquent la sortie.
@danger on
didi.determine: Tokende ! Ma moto est derrière, et je connais chaque nid-de-poule de Kin !
@exit
@bg kinshasa nuit
@place Kinshasa · Boulevard du 30-Juin
@music action
@game poursuite_kin
@danger off
@music tension
> Au bout d'une ruelle, le moteur se tait. Le silence. Puis la respiration d'Awa, qui tremble.
kofi.triste: On va le retrouver. Je te le promets.
? Que dire à Kofi ?
- « Merci d'être là, Kofi. » => trust +1 ; goto merci
- « C'est mon combat. Tu devrais rentrer. » => trust -1 ; goto seule
@label merci
kofi.sourire: Tu rigoles ? Je viens de faire de la rumba devant six cents personnes. Je ne te lâche plus.
@goto suite
@label seule
kofi.determine: Rentrer ? Ils ont poussé ma tante dans l'escalier. C'est aussi mon combat, que tu le veuilles ou non.
@label suite
@fact fleuve_congo
didi.neutre: Lukusa dit que la sixième gardienne vit à Addis-Abeba. Une savante qui veille sur la plus vieille dame du monde.
awa.determine: Addis-Abeba. Puis Le Caire. 72 heures. On y va.
@end`,
  },
  {
    id: 'addis', num: 6, city: 'Addis-Abeba', country: 'Éthiopie', flag: 'et', ll: [38.75, 9.03], sub: 'Le huitième homme',
    desc: 'Comment les hommes gris arrivent-ils toujours les premiers ? À Addis-Abeba, la vérité va faire très mal.',
    script: `
@bg avion
@music addis
>> Vol Kinshasa – Addis-Abeba. Il reste 61 heures.
@bg addis jour
@place Addis-Abeba · Musée national d'Éthiopie
@title
> Addis-Abeba. À plus de 2 300 mètres d'altitude, l'air est frais et les jacarandas sont en fleur.
@fact addis
@bg labo
makeda.neutre: Selam. Je suis la docteure Makeda Tesfaye. Seydou m'a prévenue : « Si Awa vient, c'est que je ne peux plus venir. »
makeda.sourire: Je vous présente Dinknesh. Vous l'appelez Lucy. Elle a vu passer tous nos secrets.
@fact lucy
makeda.inquiet: Mais il y a un problème. Ce matin, deux hommes en gris ont demandé à visiter les réserves. Personne ne savait que vous veniez ici. *Personne*.
kofi.determine: Sauf quelqu'un qui écoute. Awa, ton téléphone. Cette fois, je l'ouvre.
@if kofi_tel pret
awa.inquiet: … D'accord. Fais-le.
@goto ouvre
@label pret
kofi.sourire: J'ai apporté mes outils depuis Accra. Je m'en doutais un peu.
@label ouvre
@game fouille_telephone
@sfx stinger
kofi.colere: Là ! Une puce espionne, soudée sous la batterie. Ce téléphone envoie ta position chaque minute.
kofi.neutre: Et regarde la gravure : « IS Holdings ».
@clue puce
awa.surpris: IS… *Ibrahima Sarr*. Holdings.
awa.triste: Non… Pas Tonton. Pas lui.
makeda.neutre: Appelez-le. Les menteurs se trahissent toujours, quand on les écoute bien.
@exit
@game confrontation_ibrahima
@sfx stinger
@music tension
ibrahima.colere: … Très bien. Tu es aussi têtue que Seydou.
ibrahima.malin: Oui. C'est moi qu'on appelle *le Collectionneur*. Le huitième homme de la photo. Celui que les Sept ont refusé.
ibrahima.colere: Quarante ans que je regarde ces sept vieux fous cacher le plus grand trésor d'Afrique dans une cave ! Moi, je vais le montrer au monde. À ceux qui peuvent le payer.
@if doute doute
@goto menace
@label doute
ibrahima.malin: Tu as douté de moi dès le monument, n'est-ce pas ? Seydou t'a bien élevée.
@label menace
ibrahima.neutre: Viens au Caire avec les six clés. Seule. Sinon, tu ne reverras jamais ton grand-père.
@clue aveu
@exit
awa.triste: …
kofi.inquiet: Awa ?
awa.determine: Il croit qu'il a gagné. Il croit qu'il connaît chacun de mes pas.
kofi.malin: Justement. Sa puce, je peux la garder en vie… et lui faire croire que tu es ailleurs.
? Que faire du mouchard ?
- Le garder et piéger le Collectionneur => set ruse ; trust +1 ; goto ruse
- Le détruire tout de suite => goto detruit
@label ruse
kofi.sourire: Au Caire, il croira que tu l'attends aux pyramides. Pendant ce temps, on sera là où il ne regarde pas.
@goto cle
@label detruit
> Kofi écrase la puce sous son talon. Quelque part, un point rouge disparaît d'un écran.
kofi.neutre: Au moins, il est aveugle. Mais maintenant, il sait que tu sais.
@label cle
makeda.neutre: Ma clé était cachée dans la réplique de Dinknesh, sous sa main. Personne ne fouille une vieille dame.
@key 6
awa.surpris: Une branche de caféier. La *sixième clé*.
@fact calendrier
makeda.determine: La septième gardienne s'appelle Nour Hassan. Au Caire, dans le vieux souk. Allez. Et revenez me raconter.
@end`,
  },
  {
    id: 'caire', num: 7, city: 'Le Caire', country: 'Égypte', flag: 'eg', ll: [31.24, 30.04], sub: 'La septième porte',
    desc: 'Sous le plus vieux souk du Caire, une porte attend depuis sept siècles. Et le Collectionneur attend devant.',
    script: `
@bg caire soir
@music caire
@place Le Caire · Il reste 9 heures
@title
> Le Caire. Au-delà du Nil, les pyramides de Gizeh veillent depuis 4 500 ans.
@fact pyramides
nour.neutre: Ahlan, Awa. Je suis Nour. Ma mère était la septième gardienne. Elle m'a tout appris, et m'a fait jurer de ne rien dire.
nour.inquiet: Le Livre des Rives est ici, sous le souk. Depuis 1324. Votre Mansa Musa n'a pas seulement distribué de l'or au Caire.
@fact mansa_or
nour.determine: La septième clé est dans le coffre de ma mère. Son cadenas est écrit dans la langue des pharaons.
@exit
@game cadenas_hiero
@key 7
awa.surpris: Une pyramide et un soleil. La *septième clé*.
@fact khan
@if ruse ruse
@music tension
nour.inquiet: Les hommes gris sont partout dans le souk. Ils savent que vous êtes ici.
@goto souk
@label ruse
kofi.malin: Et pendant ce temps, le mouchard se promène dans un taxi, direction les pyramides. La moitié de ses hommes l'a suivi !
nour.inquiet: Il en reste quand même autour de la porte. Soyez prudents.
@label souk
@exit
@bg souk
@place Le Caire · Khan el-Khalili, minuit
@game infiltration_souk
@bg bibliotheque
@music none
@place Le Caire · Sous le souk
> Au bout d'un escalier oublié : une porte ronde, sept empreintes de clés. Et devant, sous une lampe à huile…
seydou.triste: Awa… Tu n'aurais pas dû venir.
awa.triste: Papi !
ibrahima.sourire: Les retrouvailles. C'est touchant. Les sept clés, Awa. *Maintenant*.
?!10 Ibrahima tend la main.
- Lui donner les clés => goto donner
- « Libère Papi d'abord. » => goto refuser
@label donner
ibrahima.malin: Sage décision.
> Il place les sept médaillons, un à un. La porte ne bouge pas.
ibrahima.colere: Pourquoi elle ne s'ouvre pas ?!
seydou.malin: Parce qu'une clé ne suffit pas, Ibrahima. Il faut la chanson. Et toi, tu n'as jamais su écouter.
@goto chant
@label refuser
ibrahima.colere: Tu crois que tu as le choix ?
seydou.determine: Elle l'a, Ibrahima. Sans la berceuse, tes clés ne valent rien. Et toi, tu n'as jamais su écouter.
@label chant
seydou.sourire: Joue, Awa. Comme je te l'ai appris.
@exit
@game kora_finale
@sfx reveal
@flash
@music titre
> La porte s'ouvre. Une lumière d'or. Des milliers de manuscrits, intacts depuis sept siècles. La mémoire de tout un continent.
@if ruse&trust>=2 lumiere
@label aube
@sfx door
> Dans la lumière, Ibrahima arrache un manuscrit des rayonnages et renverse la lampe à huile.
ibrahima.malin: Garde ta bibliothèque, Awa. Moi, j'en emporte une page. Et crois-moi : une seule suffira.
> Quand la fumée se dissipe, il a disparu.
seydou.triste: Il reviendra. Il revient toujours.
awa.determine: Alors je serai là. Comme toi.
@ending aube
@goto epilogue
@label lumiere
ibrahima.colere: Personne ne sortira d'ici avec ce trésor ! Personne, sauf moi !
@sfx alarm
kofi.sourire: Raté, « Tonton ». Ton mouchard t'a menti toute la soirée. Et la police touristique est dans l'escalier.
ibrahima.peur: Non… *NON* !
> Les sirènes résonnent dans le souk. Le Collectionneur tombe, enfin. Sans sa collection.
seydou.sourire: Sama doom… Tu as fait ce que sept gardiens n'ont pas su faire en quarante ans.
seydou.neutre: Nous avons caché ce livre pour le protéger. Mais une mémoire qu'on cache finit par s'oublier.
awa.determine: Alors on ne le cachera plus. Le Livre des Rives appartient à tout le monde. À chaque enfant, de Dakar au Caire.
@ending lumiere
@label epilogue
@bg dakar soir
@music titre
@place Dakar · Un mois plus tard
> Un mois plus tard. Sur la terrasse de la Médina, Papi a réparé sa kora.
seydou.sourire: Les gardiens ont voté, Awa. Il nous faut une nouvelle gardienne. Une qui court plus vite que nous.
awa.surpris: Moi ?
seydou.sourire: Toi. La griotte des Sept Clés.
@if frags>=7 secret
@goto suite
@label secret
> Dans la doublure de la vieille kora, Awa trouve un feuillet que personne n'avait jamais vu…
> « Il existe une *huitième porte*. Nairobi. Kigali. Luanda. Le Livre n'a pas tout dit. »
@label suite
>> FIN… pour l'instant.
@end`,
  },
];

/* ---------------- indices ---------------- */
const CLUES = {
  photo: { art: 'photo', t: 'La photo déchirée', d: '« Les Sept — Le Caire, 1987 ». Papi et des inconnus devant une grande porte. Un visage a été arraché.' },
  lettre: { art: 'lettre', t: 'La lettre signée « I. »', d: '« Seydou, réfléchis à mon offre. Le prix sera le tien. — I. »' },
  carnet: { art: 'carnet', t: 'Le carnet de Papi', d: '« Sept portes. Sept gardiens. Une seule mémoire. »' },
  cassette: { art: 'cassette', t: 'La cassette « Awa »', d: 'La voix de Papi : « Ne fais confiance à personne. La berceuse ouvre ce que les yeux ne voient pas. »' },
  bamako: { art: 'sms', t: 'Une phrase entendue', d: '« Le Collectionneur veut cette clé avant Bamako. »' },
  telephone: { art: 'telephone', t: 'Le téléphone neuf', d: 'Cadeau de Tonton Ibrahima : « Avec celui-ci, ils ne pourront pas te suivre. »' },
  billet: { art: 'billet', t: 'Le billet pour Bamako', d: 'Offert par Tonton Ibrahima à l\'aube. Acheté la veille, à 22 h 10.' },
  lettre_mariam: { art: 'lettre', t: 'La lettre de Mariam', d: 'Le Livre des Rives, emporté au Caire en 1324. Sept gardiens, sept clés.' },
  numero: { art: 'sms', t: 'Mon nouveau numéro', d: 'Les hommes gris le connaissent. Je ne l\'ai donné qu\'à Tonton… et à Fanta.' },
  ami_caire: { art: 'plume', t: '« Un ami du Caire »', d: 'Papi avait peur de « celui qui était avec nous au Caire ».' },
  photo_complete: { art: 'photo', t: 'La photo intacte', d: 'Huit personnes, pas sept. Le huitième homme porte un costume.' },
  bague: { art: 'bague', t: 'La chevalière à la main grise', d: 'Le huitième homme de la photo porte une chevalière gravée d\'une main grise.' },
  croquis: { art: 'croquis', t: 'Le croquis d\'Esi', d: '« Quand le tissu est juste, il parle. »' },
  carte_kin: { art: 'carte', t: 'Carte postale de Kinshasa', d: '« Le fleuve le plus profond garde la cinquième. Demande Papa Lukusa. »' },
  otage: { art: 'sms', t: 'La photo de Papi', d: 'Ligoté sur une chaise. « Les sept clés contre ton grand-père. Le Caire. 72 heures. »' },
  puce: { art: 'puce', t: 'La puce espionne', d: 'Soudée dans le téléphone offert par Tonton. Gravée « IS Holdings ».' },
  aveu: { art: 'bague', t: 'L\'aveu', d: 'Ibrahima Sarr est le Collectionneur. Le huitième homme, refusé par les Sept.' },
};

/* ---------------- le saviez-vous ? ---------------- */
const FACTS = {
  dakar_ataya: { city: 'dakar', t: 'Les trois verres de l\'ataya', d: 'Au Sénégal, le thé à la menthe se sert en trois tournées. On dit souvent : le premier amer comme la mort, le deuxième doux comme la vie, le troisième sucré comme l\'amour.' },
  dakar_monument: { city: 'dakar', t: 'Le Monument de la Renaissance africaine', d: 'Inauguré en 2010 sur une colline des Mamelles, il mesure une cinquantaine de mètres : c\'est l\'une des plus grandes statues d\'Afrique.' },
  dakar_ouest: { city: 'dakar', t: 'Tout à l\'ouest', d: 'La pointe des Almadies, à Dakar, est le point le plus occidental de l\'Afrique continentale.' },
  bamako_nom: { city: 'bamako', t: 'Le marigot du caïman', d: 'En bambara, Bamako est souvent traduit par « le marigot du caïman ». Le caïman figure d\'ailleurs sur les armoiries de la ville.' },
  bogolan: { city: 'bamako', t: 'Le bogolan', d: 'Ce tissu malien est teint avec de la boue fermentée. « Bogo » veut dire la terre, « lan » : issu de. Chaque motif porte un sens.' },
  mansa_musa: { city: 'bamako', t: 'Mansa Musa', d: 'Empereur du Mali au XIVe siècle, Mansa Musa est souvent cité comme l\'un des hommes les plus riches de toute l\'histoire.' },
  yakro_capitale: { city: 'yamoussoukro', t: 'Deux capitales', d: 'Yamoussoukro est la capitale politique de la Côte d\'Ivoire depuis 1983. Abidjan reste la capitale économique et la plus grande ville du pays.' },
  basilique: { city: 'yamoussoukro', t: 'Notre-Dame de la Paix', d: 'Consacrée en 1990, la basilique de Yamoussoukro est l\'une des plus grandes églises du monde. Son dôme se voit à des kilomètres.' },
  crocodiles: { city: 'yamoussoukro', t: 'Les crocodiles sacrés', d: 'Le lac qui entoure le palais présidentiel abrite des crocodiles sacrés, nourris par un gardien sous le regard des visiteurs.' },
  accra_independance: { city: 'accra', t: '1957, l\'étoile noire', d: 'En 1957, le Ghana devient l\'un des premiers pays d\'Afrique subsaharienne à obtenir son indépendance. La Black Star Gate d\'Accra célèbre cette victoire.' },
  kente: { city: 'accra', t: 'Le langage du kente', d: 'Le kente est tissé en bandes étroites cousues ensemble. Chaque couleur parle : l\'or pour la royauté, le vert pour la récolte, le rouge pour la lutte, le noir pour les ancêtres.' },
  cercueils: { city: 'accra', t: 'Des cercueils extraordinaires', d: 'Près d\'Accra, à Teshie, des artisans fabriquent des cercueils en forme de poisson, d\'avion ou de piment, qui racontent la vie du défunt.' },
  kin_brazza: { city: 'kinshasa', t: 'Deux capitales face à face', d: 'Kinshasa et Brazzaville se regardent de part et d\'autre du fleuve Congo. Ce sont les capitales les plus proches du monde, après Rome et le Vatican.' },
  rumba: { city: 'kinshasa', t: 'La rumba congolaise', d: 'Depuis 2021, la rumba congolaise est inscrite au patrimoine culturel immatériel de l\'humanité par l\'UNESCO.' },
  fleuve_congo: { city: 'kinshasa', t: 'Le fleuve le plus profond', d: 'Le fleuve Congo est le plus profond du monde : plus de 220 mètres à certains endroits.' },
  addis: { city: 'addis', t: 'La nouvelle fleur', d: 'Addis-Abeba veut dire « nouvelle fleur » en amharique. Perchée à plus de 2 300 mètres, elle accueille le siège de l\'Union africaine.' },
  lucy: { city: 'addis', t: 'Dinknesh', d: 'Le squelette de Lucy, vieux de 3,2 millions d\'années, est conservé à Addis-Abeba. En amharique, on l\'appelle Dinknesh : « tu es merveilleuse ».' },
  calendrier: { city: 'addis', t: 'Treize mois de soleil', d: 'Le calendrier éthiopien compte treize mois et a sept à huit ans de décalage avec le calendrier grégorien.' },
  pyramides: { city: 'caire', t: 'La dernière merveille', d: 'La Grande Pyramide de Gizeh a environ 4 500 ans. C\'est la seule des Sept Merveilles du monde antique encore debout.' },
  mansa_or: { city: 'caire', t: 'L\'or de Mansa Musa', d: 'En 1324, Mansa Musa passa par Le Caire en route vers La Mecque. Il distribua tant d\'or que son cours baissa pendant des années.' },
  khan: { city: 'caire', t: 'Khan el-Khalili', d: 'Le grand souk du Caire a été fondé à la fin du XIVe siècle. On y marchande encore, sous les lanternes, plus de six cents ans plus tard.' },
};

/* ---------------- personnages (carnet) ---------------- */
const BIOS = {
  awa: 'Awa Ndiaye, 22 ans. Étudiante en archéologie à Dakar. Curieuse, têtue, petite-fille du dernier griot de la Médina.',
  seydou: 'Seydou Ndiaye. Griot, joueur de kora, gardien de la clé de Dakar.',
  ibrahima: 'Ibrahima Sarr. Homme d\'affaires, ami d\'enfance de Papi. Toujours là quand il faut. Peut-être un peu trop.',
  fanta: 'Fanta Coulibaly. Griotte et conservatrice au Musée national du Mali. Fille de Mariam, gardienne de Bamako.',
  akissi: 'Akissi Kouamé. Guide à Yamoussoukro, rire facile, courage immense. Petite-fille du gardien des crocodiles.',
  nanan: 'Nanan Kouamé. Gardien du lac aux crocodiles sacrés, et de la troisième clé.',
  kofi: 'Kofi Mensah. Ingénieur et pilote de drone à Accra. Neveu d\'Esi la tisserande. Ne lâche jamais rien.',
  didi: 'Ya Didi. Sapeur de Matonge, roi des costumes roses et des raccourcis de Kinshasa.',
  lukusa: 'Papa Lukusa. Légende de la rumba, gardien de la cinquième clé depuis 1987.',
  makeda: 'Dr Makeda Tesfaye. Paléoanthropologue à Addis-Abeba. Veille sur Lucy et sur la sixième clé.',
  nour: 'Nour Hassan. Égyptologue au Caire, fille de la septième gardienne.',
  agent: 'Les hommes gris. Gants gris, voix froides. Ils obéissent au Collectionneur.',
  masque: 'Le Collectionneur. Personne n\'a jamais vu son visage.',
};
const BIOS_AFTER = {
  seydou: 'Seydou Ndiaye. Griot, gardien de la clé de Dakar… et « le Hibou », qui guidait Awa en secret.',
  ibrahima: 'Ibrahima Sarr, dit le Collectionneur. Le huitième homme de la photo, refusé par les Sept.',
  masque: 'Le Collectionneur : Ibrahima Sarr, l\'ami de toujours.',
};

/* ---------------- quiz ---------------- */
const QUIZ = {
  dakar: [
    ['Quel est le point le plus à l\'ouest de l\'Afrique continentale ?', ['La pointe des Almadies', 'Le cap de Bonne-Espérance', 'Le cap Bon'], 0, 'dakar_ouest'],
    ['Combien de tournées compte le thé ataya ?', ['Une', 'Trois', 'Sept'], 1, 'dakar_ataya'],
    ['Où se dresse le Monument de la Renaissance africaine ?', ['Sur l\'île de Gorée', 'Sur une colline des Mamelles', 'Au port de Dakar'], 1, 'dakar_monument'],
  ],
  bamako: [
    ['Que signifie souvent « Bamako » en bambara ?', ['La ville du soleil', 'Le marigot du caïman', 'Le grand fleuve'], 1, 'bamako_nom'],
    ['Avec quoi teint-on le bogolan ?', ['Du jus de mangue', 'De la boue fermentée', 'De l\'indigo pur'], 1, 'bogolan'],
    ['À quel siècle régnait Mansa Musa ?', ['Au XIVe siècle', 'Au XVIIIe siècle', 'Au Xe siècle'], 0, 'mansa_musa'],
  ],
  yamoussoukro: [
    ['Depuis quand Yamoussoukro est-elle capitale politique ?', ['1960', '1983', '2000'], 1, 'yakro_capitale'],
    ['Quelle ville est la capitale économique de la Côte d\'Ivoire ?', ['Bouaké', 'Abidjan', 'San-Pédro'], 1, 'yakro_capitale'],
    ['Quels animaux sacrés vivent dans le lac du palais ?', ['Des hippopotames', 'Des tortues', 'Des crocodiles'], 2, 'crocodiles'],
  ],
  accra: [
    ['En quelle année le Ghana devient-il indépendant ?', ['1957', '1975', '1945'], 0, 'accra_independance'],
    ['Dans le kente, que représente souvent l\'or ?', ['La mer', 'La royauté', 'La pluie'], 1, 'kente'],
    ['À Teshie, on fabrique des cercueils en forme…', ['De poisson ou d\'avion', 'De carré parfait', 'De pyramide'], 0, 'cercueils'],
  ],
  kinshasa: [
    ['Quelle capitale fait face à Kinshasa, de l\'autre côté du fleuve ?', ['Luanda', 'Brazzaville', 'Kigali'], 1, 'kin_brazza'],
    ['Le fleuve Congo est le plus… du monde.', ['Long', 'Profond', 'Large'], 1, 'fleuve_congo'],
    ['Depuis quand la rumba congolaise est-elle inscrite à l\'UNESCO ?', ['2021', '1990', '2005'], 0, 'rumba'],
  ],
  addis: [
    ['Que veut dire « Addis-Abeba » ?', ['Grande montagne', 'Nouvelle fleur', 'Ville du café'], 1, 'addis'],
    ['Quel âge a le squelette de Lucy ?', ['3 200 ans', '320 000 ans', '3,2 millions d\'années'], 2, 'lucy'],
    ['Combien de mois compte le calendrier éthiopien ?', ['12', '13', '10'], 1, 'calendrier'],
  ],
  caire: [
    ['Quel âge a environ la Grande Pyramide ?', ['1 000 ans', '4 500 ans', '10 000 ans'], 1, 'pyramides'],
    ['En quelle année Mansa Musa passe-t-il au Caire ?', ['1324', '1492', '1066'], 0, 'mansa_or'],
    ['Le souk Khan el-Khalili date du…', ['XIVe siècle', 'XIXe siècle', 'XXe siècle'], 0, 'khan'],
  ],
};

/* ---------------- trophées ---------------- */
const TROPHIES = {
  premiere_cle: ['Première porte', 'Obtenir la clé de Dakar.'],
  sept_cles: ['Les Sept Clés', 'Réunir les sept médaillons.'],
  lumiere: ['Fin : La mémoire libre', 'Piéger le Collectionneur avec Kofi.'],
  aube: ['Fin : L\'aube incertaine', 'Sauver Papi… mais laisser fuir le Collectionneur.'],
  mefiance: ['Méfiante', 'Douter de Tonton dès la première aube.'],
  curieuse: ['Curieuse', 'Réussir les quiz des sept capitales.'],
  fragments: ['La huitième porte', 'Trouver les 7 fragments de mémoire.'],
  ombre: ['Une ombre', 'Finir une infiltration sans jamais se faire repérer.'],
  rumba: ['Reine de la rumba', 'Réussir le concert avec au moins 95 % de précision.'],
  quiz: ['Griotte savante', 'Réussir un quiz sans aucune faute.'],
  etoiles: ['Perfectionniste', 'Obtenir 3 étoiles à tous les défis d\'un chapitre.'],
};

/* ---------------- mini-jeux ---------------- */
const BERCEUSE = [4, 6, 5, 3, 4, 2, 3, 0];   // cordes de la kora (0 = la plus grave)

const GAMES = {
  fouille_chambre: { type: 'fouille', title: 'La chambre de Papi', scene: 'chambre', time: 90, frag: 'dakar',
    tuto: 'Retrouve les objets laissés par Papi dans la chambre saccagée. Touche-les. Attention : chaque erreur coûte du temps.' },
  kora_berceuse: { type: 'kora', title: 'La berceuse de Papi', seq: BERCEUSE.slice(0, 6), start: 3,
    tuto: 'Écoute la mélodie, puis rejoue-la en touchant les cordes de la kora dans le même ordre.' },
  poursuite_medina: { type: 'runner', title: 'Fuite dans la Médina', theme: 'medina', time: 40,
    tuto: 'Glisse à gauche ou à droite pour changer de couloir, vers le haut pour sauter. Ne te fais pas rattraper !' },
  cadenas_bogolan: { type: 'cadenas', title: 'Le coffre de Mariam', set: 'bogolan', first: 0, last: 1,
    riddle: '« Le fleuve d\'abord, la pierre à la fin. »',
    tuto: 'Trouve la combinaison de 4 signes, tous différents. Après chaque essai : un point d\'or pour un signe bien placé, un point blanc pour un bon signe mal placé.' },
  pirogue_niger: { type: 'runner', title: 'La pirogue de Fanta', theme: 'niger', time: 42, frag: 'bamako',
    tuto: 'Esquive les rochers et les hippopotames. Un cauri doré flotte quelque part sur le fleuve…' },
  infiltration_lac: { type: 'infiltration', title: 'Les gardiens du lac', theme: 'lac', levels: 'lac', frag: 'yamoussoukro',
    tuto: 'Avance case par case. Après chacun de tes pas, les gardes bougent. Ne finis jamais ton tour dans une zone rouge : c\'est leur regard. Les buissons te cachent.' },
  fouille_atelier: { type: 'fouille', title: 'L\'atelier d\'Esi', scene: 'atelier', time: 90, frag: 'accra',
    tuto: 'Fouille l\'atelier de la tisserande. Les indices se cachent parmi les bobines et les tissus.' },
  kente_esi: { type: 'kente', title: 'Le kente d\'Esi',
    tuto: 'Le kente est tissé en bandes. Fais glisser chaque bande vers le haut ou le bas pour reconstituer le motif modèle.' },
  rythme_club: { type: 'rythme', title: 'Concert à Matonge', bpm: 112, beats: 64, frag: 'kinshasa',
    tuto: 'Touche chaque tambour quand la note atteint la ligne dorée. Garde le rythme pour conquérir la salle !' },
  poursuite_kin: { type: 'runner', title: 'Moto dans Kinshasa', theme: 'kin', time: 45,
    tuto: 'Ya Didi pilote, tu guides ! Glisse pour esquiver les bus et les motos. Vers le haut pour sauter les nids-de-poule.' },
  fouille_telephone: { type: 'fouille', title: 'Le téléphone ouvert', scene: 'telephone', time: 75, frag: 'addis',
    tuto: 'Kofi a ouvert le téléphone. Repère tout ce qui n\'a rien à faire là-dedans.' },
  confrontation_ibrahima: { type: 'confrontation', title: 'L\'appel',
    tuto: 'Tonton Ibrahima va mentir. Quand une phrase sonne faux, appuie sur « Objection ! » et présente l\'indice qui la contredit.' },
  cadenas_hiero: { type: 'cadenas', title: 'Le coffre de la gardienne', set: 'hiero', first: 0, last: 1,
    riddle: '« Le soleil se lève en premier ; l\'œil veille en dernier. »',
    tuto: 'Même principe qu\'à Bamako : 4 signes tous différents, un point d\'or par signe bien placé, un point blanc par bon signe mal placé.' },
  infiltration_souk: { type: 'infiltration', title: 'Le souk à minuit', theme: 'souk', levels: 'souk', frag: 'caire',
    tuto: 'Les hommes du Collectionneur gardent le souk. Avance dans leur dos, cache-toi derrière les étals.' },
  kora_finale: { type: 'kora', title: 'La berceuse complète', seq: BERCEUSE, start: 4, finale: true,
    tuto: 'La berceuse entière, cette fois. Papi te regarde. Ne tremble pas.' },
};

const CH_GAMES = {};
for (const ch of CHAPTERS) CH_GAMES[ch.id] = [...ch.script.matchAll(/@game (\w+)/g)].map(m => m[1]);

/* ---------------- analyse des scripts ---------------- */
const NB = s => s.replace(/ ([?!:;»])/g, ' $1').replace(/« /g, '« ');

function parseScript(src) {
  const steps = [], labels = {};
  const lines = src.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if (l[0] === '@') {
      const cmd = l.slice(1).split(/\s+/)[0], rest = l.slice(1 + cmd.length).trim();
      if (cmd === 'label') { labels[rest] = steps.length; continue; }
      steps.push({ t: cmd, a: rest.split(/\s+/).filter(Boolean), rest: NB(rest) });
    } else if (l.startsWith('>>')) steps.push({ t: 'narr', big: true, text: NB(l.slice(2).trim()) });
    else if (l[0] === '>') steps.push({ t: 'narr', text: NB(l.slice(1).trim()) });
    else if ((m = l.match(/^sms:(\w+)\s+(.*)$/))) steps.push({ t: 'sms', from: m[1], text: NB(m[2]) });
    else if ((m = l.match(/^sms>me\s+(.*)$/))) steps.push({ t: 'sms', from: 'me', text: NB(m[1]) });
    else if (l[0] === '?') {
      const tm = l.match(/^\?(?:!(\d+))?\s*(.*)$/);
      const opts = [];
      while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
        const [label, acts = ''] = lines[++i].slice(2).split('=>');
        opts.push({ text: NB(label.trim()), acts: acts.split(';').map(a => a.trim()).filter(Boolean) });
      }
      steps.push({ t: 'choice', q: NB(tm[2]), timer: tm[1] ? +tm[1] : 0, opts });
    } else if ((m = l.match(/^(\w+)(?:\.(\w+))?:\s*(.*)$/))) steps.push({ t: 'say', who: m[1], mood: m[2] || 'neutre', text: NB(m[3]) });
    else console.warn('Ligne de script inconnue :', l);
  }
  return { steps, labels };
}

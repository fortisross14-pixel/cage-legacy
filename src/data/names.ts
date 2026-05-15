/**
 * Per-country first and last name pools.
 *
 * Keyed by Country.code (matches data/index.ts COUNTRIES). When the country
 * isn't in the map, fall back to GENERIC pools.
 *
 * These are realistic samples, not exhaustive. Designed to read as plausibly
 * native names for each region. Mix of common and less-common entries so
 * generated fighters don't all sound the same.
 */

export interface NamePool {
  first: string[];
  last: string[];
}

export const GENERIC_POOL: NamePool = {
  first: [
    'Alex', 'Chris', 'Daniel', 'David', 'James', 'John', 'Marco', 'Nick',
    'Ryan', 'Sam', 'Tom', 'Tony', 'Vince',
  ],
  last: [
    'Adams', 'Baker', 'Carter', 'Davis', 'Evans', 'Fisher', 'Grant',
    'Hall', 'Hunter', 'James', 'King', 'Lopez', 'Martin', 'Nelson',
  ],
};

export const NAMES_BY_COUNTRY: Record<string, NamePool> = {
  // ── United States ─────────────────────────────────────
  US: {
    first: [
      'Aaron', 'Anthony', 'Brandon', 'Cody', 'Cole', 'Conor', 'Cory',
      'Damian', 'Derek', 'Dustin', 'Eddie', 'Frankie', 'Henry',
      'Jake', 'Jared', 'Jon', 'Josh', 'Justin', 'Kevin', 'Luke',
      'Matt', 'Michael', 'Mike', 'Nate', 'Pat', 'Ryan',
      'Sean', 'Scott', 'Tony', 'Tyler', 'Wyatt', 'Zach',
    ],
    last: [
      'Anderson', 'Bennett', 'Brooks', 'Brown', 'Carter', 'Clark',
      'Cooper', 'Davis', 'Edwards', 'Fitzgerald', 'Hayes', 'Hill',
      'Jackson', 'Johnson', 'King', 'Lawson', 'Lewis', 'Lopez',
      'Martin', 'Mitchell', 'Murphy', 'Nelson', 'Parker', 'Phillips',
      'Reed', 'Roberts', 'Rogers', 'Russell', 'Smith', 'Stewart',
      'Taylor', 'Walker', 'Williams', 'Wilson', 'Wright',
    ],
  },

  // ── Brazil ───────────────────────────────────────────
  BR: {
    first: [
      'Anderson', 'Antonio', 'Bruno', 'Caio', 'Carlos', 'Charles',
      'Diego', 'Douglas', 'Eduardo', 'Fabricio', 'Gilbert',
      'Jose', 'Joao', 'Junior', 'Lucas', 'Mateus', 'Marcio',
      'Murilo', 'Paulo', 'Pedro', 'Rafael', 'Renan', 'Renato',
      'Ricardo', 'Rodrigo', 'Thiago', 'Vinicius', 'Vitor', 'Wanderlei',
    ],
    last: [
      'Almeida', 'Alves', 'Barbosa', 'Barros', 'Bezerra', 'Cavalcante',
      'Costa', 'da Silva', 'Dias', 'Ferreira', 'Fonseca', 'Gomes',
      'Lima', 'Lopes', 'Machado', 'Magalhaes', 'Martins', 'Mendes',
      'Moraes', 'Nogueira', 'Oliveira', 'Pereira', 'Ramos', 'Ribeiro',
      'Rocha', 'Rodrigues', 'Santos', 'Silva', 'Soares', 'Souza', 'Teixeira',
    ],
  },

  // ── Russia ───────────────────────────────────────────
  RU: {
    first: [
      'Aleksandr', 'Aleksei', 'Andrei', 'Anton', 'Arman', 'Artem',
      'Boris', 'Dmitri', 'Evgeny', 'Fedor', 'Gleb', 'Ilya',
      'Ivan', 'Konstantin', 'Maksim', 'Mikhail', 'Nikita', 'Oleg',
      'Pavel', 'Petr', 'Roman', 'Sergei', 'Stepan', 'Timofey',
      'Valeri', 'Vasili', 'Viktor', 'Vitali', 'Yaroslav',
    ],
    last: [
      'Andreev', 'Belov', 'Borisov', 'Egorov', 'Fedorov', 'Frolov',
      'Ivanov', 'Karpov', 'Kovalev', 'Kozlov', 'Kuznetsov', 'Lebedev',
      'Makarov', 'Mikhailov', 'Morozov', 'Nikolaev', 'Novikov',
      'Orlov', 'Pavlov', 'Petrov', 'Popov', 'Romanov', 'Smirnov',
      'Sokolov', 'Solovev', 'Stepanov', 'Tarasov', 'Vasilev',
      'Volkov', 'Yakovlev', 'Zaitsev',
    ],
  },

  // ── Dagestan (Caucasus) ──────────────────────────────
  DAG: {
    first: [
      'Abdul', 'Akhmed', 'Ali', 'Arsen', 'Aslan', 'Gadzhi',
      'Gamzat', 'Hasan', 'Husein', 'Imam', 'Islam', 'Khabib',
      'Magomed', 'Murad', 'Musa', 'Omar', 'Rashid', 'Said',
      'Salim', 'Shamil', 'Sultan', 'Tagir', 'Umar', 'Usman',
      'Zaur', 'Zubaira',
    ],
    last: [
      'Abdulaev', 'Aliev', 'Asadulaev', 'Bagomedov', 'Daudov', 'Gadzhiev',
      'Gamzatov', 'Hasanov', 'Ismailov', 'Khabibov', 'Khasanov',
      'Magomedov', 'Magomedaliev', 'Musaev', 'Nurmagomedov',
      'Omarov', 'Rasulov', 'Saidov', 'Salimov', 'Shamilov',
      'Tagirov', 'Umarov', 'Yandiev', 'Yusupov',
    ],
  },

  // ── Ireland ──────────────────────────────────────────
  IE: {
    first: [
      'Aidan', 'Brendan', 'Brian', 'Cathal', 'Cian', 'Ciaran',
      'Conor', 'Cormac', 'Darragh', 'Declan', 'Dylan', 'Eoin',
      'Finbar', 'Finn', 'Liam', 'Niall', 'Oisin', 'Padraig',
      'Patrick', 'Ronan', 'Seamus', 'Sean', 'Shane', 'Tadhg',
    ],
    last: [
      'Boyle', 'Brady', 'Burke', 'Byrne', "O'Brien", 'Cassidy',
      'Connolly', 'Daly', 'Doherty', 'Doyle', 'Duffy', 'Fitzgerald',
      'Gallagher', 'Kavanagh', 'Kelly', 'Lynch', 'McCarthy', 'McDonagh',
      'McGrath', 'McLaughlin', 'Murphy', 'Murray', 'Nolan', "O'Connor",
      "O'Neill", "O'Sullivan", 'Quinn', 'Ryan', 'Walsh',
    ],
  },

  // ── England ──────────────────────────────────────────
  'GB-ENG': {
    first: [
      'Alfie', 'Archie', 'Callum', 'Charlie', 'Dan', 'Dean',
      'George', 'Harry', 'Jack', 'Jake', 'James', 'Jamie',
      'Leon', 'Liam', 'Louis', 'Luke', 'Mason', 'Max',
      'Michael', 'Oliver', 'Oscar', 'Owen', 'Reece', 'Tom',
      'Tommy', 'Tyson', 'William',
    ],
    last: [
      'Allen', 'Bailey', 'Baker', 'Brown', 'Carter', 'Clarke',
      'Cooper', 'Cox', 'Davies', 'Edwards', 'Evans', 'Foster',
      'Green', 'Hall', 'Harris', 'Hill', 'Holmes', 'Hunt',
      'Jones', 'Kelly', 'King', 'Knight', 'Mason', 'Moore',
      'Murray', 'Palmer', 'Parker', 'Pearce', 'Richards', 'Roberts',
      'Russell', 'Shaw', 'Stone', 'Taylor', 'Thompson', 'Wallace',
      'Walker', 'Watson', 'Wood', 'Wright',
    ],
  },

  // ── Mexico ───────────────────────────────────────────
  MX: {
    first: [
      'Alejandro', 'Alfredo', 'Angel', 'Armando', 'Arturo', 'Carlos',
      'Cesar', 'Cristian', 'Diego', 'Eduardo', 'Emilio', 'Enrique',
      'Ernesto', 'Esteban', 'Fernando', 'Francisco', 'Gilberto',
      'Hector', 'Ivan', 'Javier', 'Jesus', 'Jorge', 'Juan',
      'Julio', 'Luis', 'Manuel', 'Mario', 'Miguel', 'Pablo',
      'Rafael', 'Raul', 'Ricardo', 'Sergio',
    ],
    last: [
      'Aguilar', 'Alvarez', 'Castillo', 'Castro', 'Chavez', 'Cruz',
      'Diaz', 'Dominguez', 'Espinoza', 'Estrada', 'Flores', 'Garcia',
      'Gomez', 'Gonzalez', 'Guerrero', 'Gutierrez', 'Hernandez',
      'Herrera', 'Jimenez', 'Lopez', 'Luna', 'Martinez', 'Mendoza',
      'Morales', 'Moreno', 'Munoz', 'Navarro', 'Ortega', 'Perez',
      'Ramirez', 'Ramos', 'Reyes', 'Rivera', 'Rodriguez', 'Rojas',
      'Romero', 'Ruiz', 'Sanchez', 'Santiago', 'Soto', 'Torres', 'Vargas',
    ],
  },

  // ── Japan ────────────────────────────────────────────
  JP: {
    first: [
      'Akira', 'Daichi', 'Daisuke', 'Hayato', 'Hideo', 'Hiroshi',
      'Jiro', 'Junya', 'Kaito', 'Kazuki', 'Kenji', 'Kenta',
      'Kohei', 'Kosuke', 'Makoto', 'Masato', 'Masaya', 'Naoki',
      'Norifumi', 'Ren', 'Riku', 'Ryo', 'Ryota', 'Satoshi',
      'Shinya', 'Sho', 'Shogo', 'Sota', 'Takeshi', 'Takumi',
      'Tatsuya', 'Tetsuo', 'Yoshihiro', 'Yuki', 'Yusuke', 'Yuto',
    ],
    last: [
      'Abe', 'Aoki', 'Endo', 'Fujimoto', 'Fujita', 'Goto',
      'Hashimoto', 'Hayashi', 'Honda', 'Inoue', 'Ishida', 'Ito',
      'Kato', 'Kimura', 'Kobayashi', 'Kondo', 'Maeda', 'Matsuda',
      'Mori', 'Nakamura', 'Nakano', 'Ogawa', 'Okamoto', 'Saito',
      'Sasaki', 'Sato', 'Shimizu', 'Suzuki', 'Takahashi', 'Takeda',
      'Tanaka', 'Watanabe', 'Yamada', 'Yamamoto', 'Yamashita', 'Yoshida',
    ],
  },

  // ── South Korea ──────────────────────────────────────
  KR: {
    first: [
      'Beom', 'Chan', 'Dae', 'Do-hyun', 'Doo-ho', 'Hyun',
      'Hyun-woo', 'Jae', 'Jin', 'Jong', 'Joon', 'Joon-ho',
      'Kang', 'Min', 'Min-jae', 'Sang', 'Seok', 'Seung',
      'Seung-woo', 'Si-woo', 'Sung', 'Sung-hyun', 'Tae', 'Yong',
      'Yoon', 'Young',
    ],
    last: [
      'Ahn', 'Bae', 'Cha', 'Choi', 'Chung', 'Han',
      'Hong', 'Hwang', 'Im', 'Jang', 'Jeong', 'Jung',
      'Kang', 'Kim', 'Kwon', 'Lee', 'Lim', 'Moon',
      'Nam', 'Oh', 'Pak', 'Park', 'Ryu', 'Seo',
      'Shin', 'Son', 'Song', 'Yang', 'Yoo', 'Yoon',
    ],
  },

  // ── Nigeria ──────────────────────────────────────────
  NG: {
    first: [
      'Abayomi', 'Adebayo', 'Adeola', 'Akin', 'Babatunde', 'Bola',
      'Chidi', 'Chinedu', 'Chuka', 'Daniel', 'Dapo', 'Dele',
      'Ebuka', 'Emeka', 'Femi', 'Gbenga', 'Ibrahim', 'Ifeanyi',
      'Ikenna', 'Israel', 'Kamoru', 'Kayode', 'Kunle', 'Lekan',
      'Musa', 'Nnamdi', 'Obi', 'Olufemi', 'Samuel', 'Segun',
      'Tobi', 'Tunde', 'Uche', 'Yemi',
    ],
    last: [
      'Abiodun', 'Achebe', 'Adebayo', 'Adeleke', 'Adesanya', 'Adeyemi',
      'Afolayan', 'Akinwande', 'Aliyu', 'Bakare', 'Balogun', 'Chukwu',
      'Egwu', 'Eze', 'Igbinedion', 'Iwobi', 'Kalu', 'Lawal',
      'Mbeki', 'Nnaji', 'Nwosu', 'Obi', 'Obasi', 'Odinaka',
      'Okafor', 'Okeke', 'Okonkwo', 'Okoro', 'Okoye', 'Oladipo',
      'Olatunji', 'Onyema', 'Owolabi', 'Sani',
    ],
  },

  // ── New Zealand ──────────────────────────────────────
  NZ: {
    first: [
      'Adam', 'Aiden', 'Beau', 'Ben', 'Blake', 'Caleb',
      'Cameron', 'Connor', 'Dane', 'Ethan', 'Hemi', 'Hone',
      'Hunter', 'Jacob', 'Jordan', 'Kane', 'Kauri', 'Liam',
      'Marama', 'Mason', 'Matiu', 'Noah', 'Rangi', 'Riley',
      'Tane', 'Tipene', 'Wiremu', 'Zane',
    ],
    last: [
      'Adams', 'Anderson', 'Brown', 'Campbell', 'Carter', 'Clark',
      'Cooper', 'Davis', 'Edwards', 'Hapeta', 'Harris', 'Hemana',
      'Hughes', 'Jackson', 'King', 'Mahuta', 'McKay', 'Mitchell',
      'Ngata', 'Parata', 'Reti', 'Ruru', 'Smith', 'Tahana',
      'Tane', 'Te Kanawa', 'Thompson', 'Tipene', 'Walker', 'Wright',
    ],
  },

  // ── Australia ────────────────────────────────────────
  AU: {
    first: [
      'Aaron', 'Bailey', 'Ben', 'Brad', 'Caleb', 'Cameron',
      'Connor', 'Cooper', 'Dean', 'Dylan', 'Ethan', 'Harrison',
      'Hayden', 'Jack', 'Jackson', 'Jake', 'Jarrod', 'Jordan',
      'Josh', 'Liam', 'Mason', 'Nathan', 'Noah', 'Riley',
      'Ryan', 'Shane', 'Tyson', 'Will',
    ],
    last: [
      'Anderson', 'Brown', 'Byrne', 'Campbell', 'Clark', 'Cook',
      'Davis', 'Evans', 'Fraser', 'Green', 'Hall', 'Harris',
      'Hughes', 'Jenkins', 'Jones', 'Kennedy', 'Kerr', 'King',
      'Lee', 'Lewis', 'Mitchell', 'Murphy', 'Nelson', 'O\'Connor',
      'Roberts', 'Robinson', 'Ryan', 'Smith', 'Stewart', 'Sullivan',
      'Taylor', 'Walker', 'Watson', 'White', 'Wilson', 'Wright',
    ],
  },

  // ── Canada ───────────────────────────────────────────
  CA: {
    first: [
      'Aaron', 'Adam', 'Alex', 'Anthony', 'Benjamin', 'Brandon',
      'Brett', 'Carter', 'Cole', 'Daniel', 'David', 'Dylan',
      'Ethan', 'Evan', 'Gabriel', 'Garrett', 'Hunter', 'Jacob',
      'Jordan', 'Joseph', 'Liam', 'Logan', 'Lucas', 'Mason',
      'Nathan', 'Noah', 'Owen', 'Ryan', 'Samuel', 'Tyler',
    ],
    last: [
      'Anderson', 'Beaulieu', 'Bergeron', 'Brown', 'Campbell', 'Carter',
      'Clark', 'Davis', 'Dubois', 'Fortin', 'Gagnon', 'Gauthier',
      'Hall', 'Jenkins', 'Johnson', 'Lavigne', 'Leblanc', 'Lefebvre',
      'MacDonald', 'Mackenzie', 'Martin', 'Murphy', 'Nelson', 'Pelletier',
      'Roy', 'Smith', 'Taylor', 'Tremblay', 'Walker', 'Wilson',
    ],
  },

  // ── Poland ───────────────────────────────────────────
  PL: {
    first: [
      'Adam', 'Adrian', 'Aleksander', 'Andrzej', 'Bartosz', 'Damian',
      'Daniel', 'Dawid', 'Dominik', 'Filip', 'Grzegorz', 'Hubert',
      'Jakub', 'Jan', 'Jaroslaw', 'Jerzy', 'Karol', 'Kacper',
      'Krzysztof', 'Lukasz', 'Maciej', 'Marcin', 'Marek', 'Mateusz',
      'Michal', 'Pawel', 'Piotr', 'Przemyslaw', 'Rafal', 'Stanislaw',
      'Tomasz', 'Wojciech',
    ],
    last: [
      'Adamczyk', 'Bak', 'Czarnecki', 'Dabrowski', 'Domanski',
      'Dudek', 'Glowacki', 'Górski', 'Jablonski', 'Jankowski',
      'Kaczmarek', 'Kalinowski', 'Kamiński', 'Kowalczyk', 'Kowalski',
      'Kozlowski', 'Krawczyk', 'Lewandowski', 'Maciejewski',
      'Mazur', 'Michalski', 'Nowak', 'Piotrowski', 'Sikora',
      'Stepien', 'Szymanski', 'Walczak', 'Wojcik', 'Wozniak',
      'Wysocki', 'Zajac', 'Zielinski',
    ],
  },

  // ── Sweden ───────────────────────────────────────────
  SE: {
    first: [
      'Albin', 'Anders', 'Anton', 'Axel', 'Björn', 'Daniel',
      'Elias', 'Emil', 'Erik', 'Filip', 'Gustaf', 'Hans',
      'Henrik', 'Hugo', 'Isak', 'Jakob', 'Johan', 'Jonas',
      'Karl', 'Kristoffer', 'Lars', 'Linus', 'Magnus', 'Mattias',
      'Niklas', 'Oscar', 'Patrik', 'Per', 'Pontus', 'Robin',
      'Simon', 'Viktor',
    ],
    last: [
      'Andersson', 'Bergman', 'Bergström', 'Berg', 'Carlsson',
      'Eklund', 'Eriksson', 'Forsberg', 'Gustafsson', 'Hansson',
      'Holm', 'Holmberg', 'Jakobsson', 'Johansson', 'Jonsson',
      'Karlsson', 'Larsson', 'Lindberg', 'Lindgren', 'Lindqvist',
      'Lundberg', 'Lundgren', 'Magnusson', 'Mattsson', 'Nilsson',
      'Nordström', 'Olsson', 'Persson', 'Petersson', 'Sandberg',
      'Sundström', 'Svensson', 'Wikström',
    ],
  },

  // ── France ───────────────────────────────────────────
  FR: {
    first: [
      'Alexandre', 'Anthony', 'Antoine', 'Arnaud', 'Baptiste', 'Benoit',
      'Christophe', 'Clément', 'Cyril', 'David', 'Dimitri', 'Étienne',
      'Florent', 'Florian', 'François', 'Frédéric', 'Geoffrey', 'Guillaume',
      'Hugo', 'Jean', 'Jérémy', 'Julien', 'Kévin', 'Laurent',
      'Loïc', 'Lucas', 'Maxime', 'Mickael', 'Nicolas', 'Olivier',
      'Paul', 'Pierre', 'Romain', 'Sébastien', 'Thomas', 'Vincent',
    ],
    last: [
      'Bernard', 'Bertrand', 'Bonnet', 'Boyer', 'Caron', 'Charpentier',
      'Chevalier', 'David', 'Dubois', 'Dufour', 'Dumont', 'Dupont',
      'Durand', 'Faure', 'Fontaine', 'Gauthier', 'Girard', 'Henry',
      'Lambert', 'Laurent', 'Lefevre', 'Legrand', 'Lemaire', 'Leroy',
      'Marchand', 'Martin', 'Mercier', 'Michel', 'Moreau', 'Morel',
      'Nicolas', 'Petit', 'Renaud', 'Richard', 'Robert', 'Rousseau',
      'Roux', 'Simon', 'Thomas', 'Vincent',
    ],
  },

  // ── Germany ──────────────────────────────────────────
  DE: {
    first: [
      'Alexander', 'Andreas', 'Benjamin', 'Christian', 'Daniel', 'David',
      'Dennis', 'Dominik', 'Fabian', 'Felix', 'Florian', 'Hannes',
      'Hans', 'Jan', 'Jens', 'Johannes', 'Jonas', 'Jürgen',
      'Kai', 'Klaus', 'Lars', 'Lukas', 'Manuel', 'Markus',
      'Martin', 'Matthias', 'Maximilian', 'Michael', 'Niklas', 'Oliver',
      'Patrick', 'Peter', 'Philipp', 'Rainer', 'Sebastian', 'Stefan',
      'Thomas', 'Tobias', 'Tom',
    ],
    last: [
      'Bauer', 'Becker', 'Berger', 'Braun', 'Engel', 'Fischer',
      'Frank', 'Fuchs', 'Hartmann', 'Heinrich', 'Herrmann', 'Hoffmann',
      'Huber', 'Jung', 'Kaiser', 'Keller', 'Klein', 'König',
      'Krause', 'Krüger', 'Lange', 'Lehmann', 'Lorenz', 'Maier',
      'Meier', 'Meyer', 'Müller', 'Neumann', 'Peters', 'Richter',
      'Roth', 'Schäfer', 'Schmidt', 'Schmitt', 'Schneider', 'Schreiber',
      'Schröder', 'Schubert', 'Schulz', 'Schulze', 'Schumacher', 'Schwarz',
      'Seidel', 'Vogel', 'Wagner', 'Walter', 'Weber', 'Werner',
      'Winkler', 'Wolf', 'Zimmermann',
    ],
  },

  // ── Netherlands ──────────────────────────────────────
  NL: {
    first: [
      'Bas', 'Bastiaan', 'Daan', 'Dennis', 'Dirk', 'Erik',
      'Floris', 'Frank', 'Gerard', 'Hendrik', 'Jan', 'Jeroen',
      'Joost', 'Joris', 'Kees', 'Kjell', 'Lars', 'Luuk',
      'Maarten', 'Marco', 'Martin', 'Mees', 'Niels', 'Patrick',
      'Pieter', 'Rens', 'Roel', 'Ruben', 'Sander', 'Sem',
      'Stijn', 'Sven', 'Tim', 'Tom', 'Wouter',
    ],
    last: [
      'Bakker', 'Boer', 'Bos', 'Brouwer', 'de Boer', 'de Bruin',
      'de Graaf', 'de Groot', 'de Jong', 'de Vries', 'Dekker', 'Dijkstra',
      'Hendriks', 'Hoekstra', 'Jacobs', 'Jansen', 'Janssen', 'Klein',
      'Kok', 'Kuiper', 'Maas', 'Meijer', 'Mulder', 'Peters',
      'Post', 'Prins', 'Schouten', 'Smit', 'Smits', 'van den Berg',
      'van der Berg', 'van der Heijden', 'van der Meer', 'van Dijk',
      'van Leeuwen', 'Verbeek', 'Visser', 'Vos', 'Willems', 'Wolters',
    ],
  },

  // ── Cameroon ─────────────────────────────────────────
  CM: {
    first: [
      'Achille', 'Alain', 'Albert', 'Bertin', 'Bertrand', 'Boris',
      'Calvin', 'Cedric', 'Christian', 'Cyril', 'Didier', 'Emmanuel',
      'Eric', 'Francis', 'Frederic', 'Gaston', 'Gerard', 'Hervé',
      'Hugo', 'Jean', 'Joseph', 'Lionel', 'Marcel', 'Maxime',
      'Michel', 'Patrick', 'Paul', 'Pierre', 'Raoul', 'Roger',
      'Serge', 'Thierry', 'Vincent', 'Yvan',
    ],
    last: [
      'Abanda', 'Atangana', 'Bayemi', 'Bekono', 'Belinga', 'Beng',
      'Biya', 'Bongo', 'Eboue', "Eto'o", 'Fokou', 'Foe',
      'Janga', 'Kameni', "M'Bia", 'Makoun', 'Manga', 'Mbah',
      'Mbappe', 'Mbida', 'Mbiwa', 'Moukandjo', 'Mukam', 'Ndongo',
      'Ngom', 'Nguemo', 'Njock', 'Ondoa', 'Ongolo', 'Salli',
      'Song', 'Tchami', 'Webo', 'Zambo',
    ],
  },

  // ── Kazakhstan ───────────────────────────────────────
  KZ: {
    first: [
      'Aldiyar', 'Almas', 'Alexei', 'Arman', 'Aybek', 'Azat',
      'Beibit', 'Berik', 'Bolat', 'Daulet', 'Dauren', 'Didar',
      'Dinmukhamed', 'Erlan', 'Gennadiy', 'Kanat', 'Kuanysh', 'Maksat',
      'Marat', 'Maxim', 'Mukhtar', 'Nurlan', 'Nursultan', 'Olzhas',
      'Ramil', 'Ruslan', 'Sanzhar', 'Serik', 'Talgat', 'Timur',
      'Yerlan', 'Yermek', 'Zhanibek',
    ],
    last: [
      'Abdrakhmanov', 'Aitkulov', 'Akhmetov', 'Aliyev', 'Bekzhanov',
      'Bolatov', 'Daulet', 'Galiyev', 'Ibragimov', 'Idrisov',
      'Iskakov', 'Ismailov', 'Kabylbekov', 'Kadyrov', 'Kasenov',
      'Kassymov', 'Kenzhebayev', 'Khasanov', 'Mukhamedjanov',
      'Mukhtarov', 'Musayev', 'Nazarov', 'Nurbekov', 'Nurlanov',
      'Omirbek', 'Sagimbayev', 'Saparov', 'Sarsenbayev', 'Seitkali',
      'Smailov', 'Sultanov', 'Tursunov', 'Yerlanov', 'Yusupov',
    ],
  },
};

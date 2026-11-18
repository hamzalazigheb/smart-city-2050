import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            'AIzaSyCUEuqyhdFDH5l_ihZrntuIqgae2MEW3Ck',
  authDomain:        'smart-city-quiz.firebaseapp.com',
  databaseURL:       'https://smart-city-quiz-default-rtdb.firebaseio.com',
  projectId:         'smart-city-quiz',
  storageBucket:     'smart-city-quiz.firebasestorage.app',
  messagingSenderId: '3480095271',
  appId:             '1:3480095271:web:5d6cc3aeb5115660e1dc02',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

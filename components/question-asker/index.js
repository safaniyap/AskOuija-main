import React, { useState, useEffect,useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import ParticipatingSpirit from '../participating-spirit';

const QuestionAsker = props => {
  //reference variable
  const counter=useRef(0);
  //state variables
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState({ id: -1, text: '' });
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [error, setError] = useState('');
  const [selectedGenre, setSelectedGenre] = useState({ id: -1, text: '' });

  const genre = ["Horror" , "family-friendly"];

  // genre variables 
 // const [genre, setGenre] = useState('');

  // selection variable for changing screens found in 'greeting' file
  const [selection, setSelection] = useState('genre');

  //save the player's question choice
  const selectQuestion = (index, question) => {
    setSelectedQuestion({ id: index, text: question });
  };

  //save the player's genre choice
  const SelectedGenre = (genre) =>{
    setSelectedGenre({text: genre});
  };

  //write the askQuestion function here
  const askQuestion = () => {
    let questionText = '';
    if (customQuestionText.length > 0) {
      questionText = customQuestionText;
    } else if (selectedQuestion.text.length > 0) {
      questionText = selectedQuestion.text;
    }

    if (questionText.length > 0) {
      firestore().collection("ao-games").doc(props.GameID).update({
        question: questionText,
      })
      .catch(err => {
        let friendlyError = { friendly: "Something has gone horribly wrong.", technical: err.toString() };
        setError(() => { throw friendlyError });
      });
    }
  };
  //update the customQuestionText if the player writes a custom question
  const doCustomQuestion = text => {
    setCustomQuestionText(text);
    if (selectedQuestion.id !== -1) {
      setSelectedQuestion({ id: -1, text: '' });
    }
  };

  //write the useEffect here
  useEffect(() => {
    //get a list of 3 randomly selected questions
    if ((props.GameData !== undefined) && (props.GameData.questionAsker.uid === props.auth.uid) && (props.GameData.question === "")) {
      setSelectedQuestion({ id: -1, text: '' });
      setCustomQuestionText('');
      const getQuestions = async() => {
        let someQuestions = [];
        while ((someQuestions.length < 3)&& (counter.current<150)) {
          let alreadyPicked = false;
          let key = firestore().collection("ao-questions").doc().id;
          let potentialQuestion = "";
          let dbQuestion = await firestore().collection("ao-questions").where(firebase.firestore.FieldPath.documentId(), ">=", key).limit(1).get();
          counter.current+=1;

          if (dbQuestion.size > 0) { // dbQuestion is going to have every question in the firebase...it waits and takes all the list of questions
            dbQuestion.forEach(q => {
                // if question has the same genre as the user-selected genre , then it is a potential question
                if (genre == q.data().genre) 
                  potentialQuestion = q.data().questionText;// only potenital if its the same genre...
            });
          } else {
            dbQuestion = await firestore().collection("ao-questions").where(firebase.firestore.FieldPath.documentId(), "<", key).limit(1).get();
           counter.current+=1;
            dbQuestion.forEach(q => {
                // if question has the same genre as the user-selected genre , then it is a potential question
                if (genre == q.data().genre)
                 potentialQuestion = q.data().questionText;
            });
          }
          someQuestions.forEach(question => {
            if (question === potentialQuestion) {
              alreadyPicked = true;
            }
          });
          if (!alreadyPicked) {
            someQuestions.push(potentialQuestion);
          }
        }
        setQuestions(someQuestions);
        console.log(counter.current);
      }
      getQuestions();
    }
  }, [props.GameData, genre]);

  //show the question list if no question has been asked
  if ((props.GameData !== undefined) && (props.GameData.question === "")) {
    return (
      <View style={props.styles.aoGameContainer}>
        <View style={props.styles.aoGameInnerContainer}>
          <View style={props.styles.aoLobbyContainer}>

            {/* from greeting */}
            {selection === 'genre' ? ( //this is the genre
              <>
              <View style={props.styles.aoLobbyInnerContainer}>
                  <Text style={props.styles.aoHeadline}>
                    {"Mortal, which genre shall the Spirits answer?"}
                  </Text>
                  <View style={{display: "flex", flexDirection: "column", marginTop: 36, alignItems: "center", justifyContent: "flex-start", width: "100%"}}>
                    {genre.map((selectedGenre) => ( // whenever the user chooses a genre...genre.map gets triggered. 
                    //TouchableOpacity makes it fade going into the quesiton. calling the two functions below
                    //that goes from genre to question. 
                      <TouchableOpacity style={selectedGenre.id === index ? props.styles.aoQuestionRowSelected : props.styles.aoQuestionRow} key={index} onPress={
                          () => setSelection('question') + setGenre(selectedGenre)}> 
                        <Text style={props.styles.aoQuestionText}>
                          {selectedGenre} 
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
              </>
              ) : (
                null
              )}

              {selection === 'question' ? ( // this is the question
                <>
              <View style={props.styles.aoLobbyInnerContainer}>
                <Text style={props.styles.aoHeadline}>
                  {"Mortal, which query shall the Spirits answer?"}
                </Text>
                <View style={{display: "flex", flexDirection: "column", marginTop: 36, alignItems: "center", justifyContent: "flex-start", width: "100%"}}>
                  {questions.map((question, index) => (
                    <TouchableOpacity style={selectedQuestion.id === index ? props.styles.aoQuestionRowSelected : props.styles.aoQuestionRow} key={index} onPress={() => selectQuestion(index, question)}>
                      <Text style={props.styles.aoQuestionText}>
                        {question}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TextInput style={{...props.styles.aoTextbox, marginHorizontal: 12, width: "100%"}} value={customQuestionText} onChangeText={text => doCustomQuestion(text)} placeholder="Ask your own question..." />
                </View>
              </View>
              <TouchableOpacity style={((selectedQuestion.id !== -1) || (customQuestionText.length > 0)) ? props.styles.aoPrimaryButton : props.styles.aoPrimaryButtonDisabled} onPress={() => askQuestion()}>
                <Text style={props.styles.aoPrimaryButtonText}>
                  {"Ask Your Question"}
                </Text>
              </TouchableOpacity>
              </>
              ) : (
                null
              )}
          </View>
        </View>
      </View>
    );
  }

  //once the question has been asked, show the spirits answering the question
  if ((props.GameData !== undefined) && (props.GameData.question !== '')) {
    return (
      <ParticipatingSpirit styles={props.styles} GameID={props.GameID} GameData={props.GameData} />
    );
  }

  //if all else fails, show nothing
  return null;
};

export default QuestionAsker;

/**
 * Scene component used as a route in the index file.
 **/

// React-native
import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import React, { Component } from 'react';
import { View } from "react-native";
import { Icon, Title, Text, List, ListItem, Left, CheckBox, Body, Right, Button } from '../../crossplatform-theme';

type Props = {
    +symptoms: Array<Question>,
    +checkedSymptomIds: Array<string>,
    +onSymptomCheckboxPressed: (questionId: string) => void,
    +onSubmit: () => void
};

const SymptomGraphMenuView = React.memo((props: Props) => 
    <>
        <List>
            {
                props.symptoms.map(s => 
                    <ListItem_
                        key={s.id}

                        label={s.label}
                        text={s.text}

                        onPress={e => props.onSymptomCheckboxPressed(s.id)}
                        checked={props.checkedSymptomIds.indexOf(s.id) !== -1}
                    />
                )
            }
        </List>
        <View style={{ paddingTop: 30, paddingRight: 30, paddingBottom: 15, paddingLeft: 30 }} >
            <Button onPress={props.onSubmit}>
                VOIR
            </Button>
        </View>
    </>
);

// @warning opti - prop.onPress is reset every time.
const ListItem_ = React.memo((props) => 
    <ListItem onPress={props.onPress}>
        <Body>
            <Title style={{ textAlign: 'left' }}>{props.label}</Title>
            <Text italic style={{ textAlign: 'left' }}>{props.text}</Text>
        </Body>
        <Right>
            <CheckBox checked={props.checked} color="green" />
        </Right>
    </ListItem>
);

export default SymptomGraphMenuView;
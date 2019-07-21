/*
 * @flow
 */

import type { Node, Element } from 'react';
import React from 'react';
import { View } from 'react-native';

import type { Question } from '../../crossplatform-model/immutable-db/QuestionType';
import { VictoryTheme, VictoryChart, VictoryArea, VictoryAxis, VictoryLine, VictoryScatter } from 'victory-native';
import { Text, Segment } from '../../crossplatform-theme';
import { Button } from 'native-base';

type Props = {|
    +width: number,
    +height: number,

    +filter: 'year' | 'month' | 'week',
    +onFilterButtonPressed: (filter: 'year' | 'month' | 'week') => void,

    +colors: Array<string>,
    +headers: Array<Question>,
    +domain: {|
        +x: [number, number],
        +y: [number, number]
    |},
    +data: Array<{|
        +symptomId: string,
        +label: string,
        +values: Array<{|
            +x: number,
            +y: number
        |}>
    |}>,
|};

const SymptomGraphView = ({ width, height, filter, onFilterButtonPressed, colors, headers, domain, data }: Props) => 
    <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ margin: 15 }}>
        </View> 
        <View style={{ height: height / 1.9 }}>
            <VictoryChart
                domain={domain}

                theme={VictoryTheme.material}   
                width={width}
                height={height / 1.9}
            >
                <VictoryAxis
                    crossAxis={false}
                    tickCount={domain.x[1] - domain.x[0]}
                    fixLabelOverlap={true}
                    tickFormat={(t) => `${t > 0 ? t : t === 0 ? '-' : new Date(new Date().getFullYear(), new Date().getMonth(), 0).getDate()+t+1}`}
                />
                {
                    data.map(
                        (item, i) =>
                            <React.Fragment key={`chart.${item.symptomId}`}>
                                {
                                    item.values.length > 1 &&
                                    <>
                                        <SplitShape
                                            domain={domain}
                                            data={item.values}
                                        >
                                            <VictoryArea
                                                style={{
                                                    data: { fill: `${colors[i]}05` }
                                                }}
                                                size={3}
                                                x="x"
                                                y="y"
                                            />
                                        </SplitShape>
                                        <SplitShape
                                            domain={domain}
                                            data={item.values}
                                        >
                                            <VictoryLine
                                                style={{
                                                    data: { stroke: `${colors[i]}75`, strokeWidth: 1 }
                                                }}
                                                x="x"
                                                y="y"
                                                interpolation="monotoneX"
                                            />
                                        </SplitShape>
                                    </>

                                    || item.values.length > 0 &&
                                    (
                                        <SplitShape
                                            domain={domain}
                                            data={item.values}
                                        >
                                            <VictoryScatter
                                                style={{ data: { fill: `${colors[i]}AA` } }}
                                                size={3}
                                                x="x"
                                                y="y"
                                            />
                                        </SplitShape>
                                    )
                                }
                            </React.Fragment>
                    )
                }
            </VictoryChart>
        </View>
        <View style={{ marginTop: 0, marginBottom: 10, position: 'relative', paddingLeft: 20, paddingRight: 20 }}>
            <Segment style={{ backgroundColor: 'white' }}>
                <Button active={filter === 'year'} first onPress={() => onFilterButtonPressed('year')}><Text>A</Text></Button>
                <Button active={filter === 'month'} onPress={() => onFilterButtonPressed('month')}><Text>M</Text></Button>
                <Button active={filter === 'week'} last onPress={() => onFilterButtonPressed('week')}><Text>S</Text></Button>
            </Segment>
        </View>
        <View style={{ margin: 30, marginTop: 15 }}>
            {
                headers.map(
                    (item, i) => 
                        <View key={`footer.${item.id}`} style={{flexDirection: 'row'}}>
                            <View style={{ width: 5, height: 5, marginTop: 9, marginRight: 10, backgroundColor: colors[i]}}/>
                            <Text style={{ marginTop: 0 }}>{item.label}</Text>
                        </View>
                )
            }
        </View>
    </View>;

type SplitShapeProps = {| 
    +domain: $PropertyType<Props, 'domain'>,
    +data: Array<{|
        +x: number,
        +y: number
    |}>,
    +children: Element<typeof React.Fragment>
|};

const SplitShape: (props: SplitShapeProps) => Node = ({ domain, data, children }: SplitShapeProps) => 
    <>
        {
            (domain.x[0] < 0 && data.filter(d => d.x < 0).length > 1 && data.filter(d => d.x > 0).length > 1) ?
            <>
                {React.cloneElement(children, { domain: domain, data: data.filter(d => d.x < 0) })}
                {React.cloneElement(children, { domain: domain, data: data.filter(d => d.x > 0) })}
            </> :
                React.cloneElement(children, { domain: domain, data: data })
        }
    </>;

export default SymptomGraphView;
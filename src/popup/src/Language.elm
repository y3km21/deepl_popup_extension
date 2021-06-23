port module Language exposing (..)

import Dict
import Html exposing (Html, div, h1, h2, h3, input, option, select, text)
import Html.Attributes exposing (attribute, class, placeholder, selected, style, value)
import Html.Events exposing (..)
import Json.Decode as JD
import Json.Encode as JE



{------------------------------
 -
 - type
 - English Amerian, English British
 - Portuguese , Portuguese Brazilian
 - の違いはURLのクエリに違いは見られなかったため　同一のものとした。
 - 詳細は確認していないがcookieかな？
 -
 ------------------------------}


type Language
    = Bulgarian
    | Chinese
    | Czech
    | Danish
    | Dutch
    | English
    | Estonian
    | Finnish
    | French
    | German
    | Greek
    | Hungarian
    | Italian
    | Japanese
    | Latvian
    | Lithuanian
    | Polish
    | Portuguese
    | Romanian
    | Russian
    | Slovak
    | Slovenian
    | Spanish
    | Swedish


type alias LanguageObject =
    { language : Language
    , abbreviation : String
    }


languages : Dict.Dict String LanguageObject
languages =
    Dict.fromList
        [ ( "Bulgarian", LanguageObject Bulgarian "bg" )
        , ( "Chinese", LanguageObject Chinese "zh" )
        , ( "Czech", LanguageObject Czech "cs" )
        , ( "Danish", LanguageObject Danish "da" )
        , ( "Dutch", LanguageObject Dutch "nl" )
        , ( "English", LanguageObject English "en" )
        , ( "Estonian", LanguageObject Estonian "et" )
        , ( "Finnish", LanguageObject Finnish "fi" )
        , ( "French", LanguageObject French "fr" )
        , ( "German", LanguageObject German "de" )
        , ( "Greek", LanguageObject Greek "el" )
        , ( "Hungarian", LanguageObject Hungarian "hu" )
        , ( "Italian", LanguageObject Italian "it" )
        , ( "Japanese", LanguageObject Japanese "ja" )
        , ( "Latvian", LanguageObject Latvian "lv" )
        , ( "Lithuanian", LanguageObject Lithuanian "lt" )
        , ( "Polish", LanguageObject Polish "pl" )
        , ( "Portuguese", LanguageObject Portuguese "pt" )
        , ( "Romanian", LanguageObject Romanian "ro" )
        , ( "Russian", LanguageObject Russian "ru" )
        , ( "Slovak", LanguageObject Slovak "sk" )
        , ( "Slovenian", LanguageObject Slovenian "sl" )
        , ( "Spanish", LanguageObject Spanish "es" )
        , ( "Swedish", LanguageObject Swedish "sv" )
        ]


abbreviations : Dict.Dict String Language
abbreviations =
    Dict.fromList
        [ ( "bg", Bulgarian )
        , ( "zh", Chinese )
        , ( "cs", Czech )
        , ( "da", Danish )
        , ( "nl", Dutch )
        , ( "en", English )
        , ( "et", Estonian )
        , ( "fi", Finnish )
        , ( "fr", French )
        , ( "de", German )
        , ( "el", Greek )
        , ( "hu", Hungarian )
        , ( "it", Italian )
        , ( "ja", Japanese )
        , ( "lv", Latvian )
        , ( "lt", Lithuanian )
        , ( "pl", Polish )
        , ( "pt", Portuguese )
        , ( "ro", Romanian )
        , ( "ru", Russian )
        , ( "sk", Slovak )
        , ( "sl", Slovenian )
        , ( "es", Spanish )
        , ( "sv", Swedish )
        ]



{------------------------------
 -
 - TranslateLanguages Model
 -
 ------------------------------}


type alias Model =
    { from : Language
    , into : Language
    }


init : Model
init =
    Model English Japanese



{------------------------------
 -
 - Port
 -
 ------------------------------}


port setLang : JE.Value -> Cmd msg


port getLanguage : () -> Cmd msg


port gotLanguage : (JE.Value -> msg) -> Sub msg



{------------------------------
 -
 - Msg
 -
 ------------------------------}


type Msg
    = GotLanguage JE.Value
    | FromSelect LanguageObject
    | IntoSelect LanguageObject



{------------------------------
 -
 - Update
 -
 ------------------------------}


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotLanguage valueJE ->
            case JD.decodeValue modelDeocder valueJE of
                Ok m ->
                    ( m, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        FromSelect langObj ->
            let
                updateModel =
                    { model | from = langObj.language }
            in
            ( updateModel, setLang <| windowSettingEncoder langObj.abbreviation From )

        IntoSelect langObj ->
            let
                updateModel =
                    { model | into = langObj.language }
            in
            ( updateModel, setLang <| windowSettingEncoder langObj.abbreviation Into )


type Direction
    = From
    | Into


windowSettingEncoder : String -> Direction -> JE.Value
windowSettingEncoder string direction =
    JE.object
        [ ( case direction of
                From ->
                    "from"

                Into ->
                    "into"
          , JE.string string
          )
        ]



{------------------------------
 -
 - subscrioptions
 -
 ------------------------------}


subscriptions : Sub Msg
subscriptions =
    Sub.batch [ gotLanguage GotLanguage ]



{------------------------------
 -
 - View
 -
 ------------------------------}


view : Model -> Html Msg
view translateLanguage =
    div [ class "setting_wrapper" ]
        [ h2 [] [ text "Translate Language" ]
        , div [ class "description" ] [ text "Translate Language Settings" ]
        , div [ class "setting_values_wrapper" ]
            [ div [ class "select_wrapper" ]
                [ h3 [] [ text "From :" ]
                , --select
                  selectLanguage FromSelect translateLanguage.from
                ]
            , div [ class "select_wrapper" ]
                [ h3 [] [ text "Into :" ]
                , --select
                  selectLanguage IntoSelect translateLanguage.into
                ]
            ]
        ]


popupView : Model -> Html Msg
popupView model =
    div [ class "context_menu_wrapper" ]
        [ h2 [] [ text "Translate Language" ]
        , div [ class "context_wrapper" ]
            [ h3 [] [ text "From :" ]
            , selectLanguage FromSelect model.from
            ]
        , div [ class "context_wrapper" ]
            [ h3 [] [ text "Into :" ]
            , --select
              selectLanguage IntoSelect model.into
            ]
        ]


selectLanguage : (LanguageObject -> msg) -> Language -> Html msg
selectLanguage selectMsg wasSetLang =
    Dict.toList languages
        |> List.map
            (\( lang_name, { language, abbreviation } ) ->
                if wasSetLang == language then
                    option [ selected True, value lang_name ] [ text lang_name ]

                else
                    option [ value lang_name ] [ text lang_name ]
            )
        |> select [ class "language_select", onChange selectMsg ]


onChange : (LanguageObject -> msg) -> Html.Attribute msg
onChange selectMsg =
    JD.map (\key -> Dict.get key languages |> Maybe.withDefault (LanguageObject English "en")) targetValue
        |> JD.map selectMsg
        |> JD.map alwaysStop
        |> stopPropagationOn "change"


alwaysStop : a -> ( a, Bool )
alwaysStop x =
    ( x, True )



{------------------------------
 -
 - Json Decoder
 -
 ------------------------------}


modelDeocder : JD.Decoder Model
modelDeocder =
    let
        languageDecoder =
            JD.map (\key -> Dict.get key abbreviations |> Maybe.withDefault English) JD.string
    in
    JD.map2 Model
        (JD.field "from" <| languageDecoder)
        (JD.field "into" <| languageDecoder)

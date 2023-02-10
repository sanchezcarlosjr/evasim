using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UIElements;
using UnityEngine.SceneManagement;

public class MenuWindow : MonoBehaviour
{
	private void Awake()
	{
		var doc = GetComponent<UIDocument>();
		Button button = doc.rootVisualElement.Q<Button>("ButtonInteractionLoader");
		button.clicked += () => {
			SceneManager.LoadScene("EvaSim");
		};
	}
} 
